// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IIdentity} from "./interfaces.sol";

/// @title ClearGiveVault
/// @notice Holds G$ for one church / NGO. Every inflow and outflow is public:
///  - donations can be earmarked to a category (e.g. "School fees")
///  - Superfluid streams sent to this address land in the General pool
///  - funds can only leave with a receipt (IPFS CID or URL) attached
///  - beneficiary payouts only go to GoodDollar-verified unique humans
contract ClearGiveVault {
    uint256 public constant GENERAL = 0;

    // The full ledger lives in storage so any frontend can read it with plain
    // view calls, without an indexer or log queries.
    struct Donation {
        address donor;
        uint64 timestamp;
        bool verifiedHuman;
        uint256 categoryId;
        uint256 amount;
        string memo;
    }

    struct Spend {
        address by;
        address to; // address(0) for beneficiary batches
        uint64 timestamp;
        uint256 categoryId;
        uint256 amount;
        uint256 beneficiaryCount;
        string receiptURI;
        string note;
    }

    struct Payout {
        address beneficiary;
        address identityRoot;
        uint256 amount;
    }

    IERC20 public immutable token;
    IIdentity public immutable identity;
    address public immutable registry;

    address public admin;
    address public pendingAdmin;
    mapping(address => bool) public isManager;
    string public metadataURI;

    string[] internal _categories;
    /// @notice G$ donated to a specific category and not yet spent.
    mapping(uint256 => uint256) public earmarked;
    uint256 public totalEarmarked;

    uint256 public totalDonated; // via donate(); streams are tracked by Superfluid
    uint256 public totalSpent; // includes beneficiary payouts
    uint256 public totalToBeneficiaries;
    uint256 public uniqueVerifiedDonors;
    uint256 public uniqueBeneficiaries;

    Donation[] internal _donations;
    Spend[] internal _spends;
    mapping(uint256 => Payout[]) internal _payouts;
    mapping(address => bool) internal _countedDonorRoot;
    mapping(address => bool) internal _countedBeneficiaryRoot;

    uint256 private _locked = 1;

    event Donated(
        address indexed donor, uint256 indexed categoryId, uint256 amount, bool verifiedHuman, string memo
    );
    event Spent(
        uint256 indexed spendId,
        address indexed by,
        address indexed to,
        uint256 categoryId,
        uint256 amount,
        string receiptURI,
        string note
    );
    event BeneficiaryPaid(
        uint256 indexed spendId, address indexed beneficiary, address indexed identityRoot, uint256 amount
    );
    event CategoryAdded(uint256 indexed categoryId, string name);
    event ManagerSet(address indexed account, bool enabled);
    event AdminTransferStarted(address indexed current, address indexed pending);
    event AdminTransferred(address indexed previous, address indexed current);
    event MetadataUpdated(string metadataURI);

    error NotAdmin();
    error NotManager();
    error InvalidCategory();
    error ZeroAmount();
    error ReceiptRequired();
    error InsufficientFunds(uint256 available, uint256 requested);
    error NotVerifiedHuman(address account);
    error LengthMismatch();
    error TransferFailed();
    error Reentrancy();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyManager() {
        if (msg.sender != admin && !isManager[msg.sender]) revert NotManager();
        _;
    }

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(IERC20 token_, IIdentity identity_, address admin_, string memory metadataURI_) {
        token = token_;
        identity = identity_;
        registry = msg.sender;
        admin = admin_;
        metadataURI = metadataURI_;
        _categories.push("General");
        emit CategoryAdded(GENERAL, "General");
        emit AdminTransferred(address(0), admin_);
    }

    // ---------------------------------------------------------------- donors

    /// @notice One-off donation. Requires prior G$ approval to this vault.
    function donate(uint256 amount, uint256 categoryId, string calldata memo) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (categoryId >= _categories.length) revert InvalidCategory();

        if (categoryId != GENERAL) {
            earmarked[categoryId] += amount;
            totalEarmarked += amount;
        }
        totalDonated += amount;
        address root = identity.getWhitelistedRoot(msg.sender);
        bool verified = root != address(0);
        if (verified && !_countedDonorRoot[root]) {
            _countedDonorRoot[root] = true;
            ++uniqueVerifiedDonors;
        }
        _donations.push(Donation(msg.sender, uint64(block.timestamp), verified, categoryId, amount, memo));
        emit Donated(msg.sender, categoryId, amount, verified, memo);

        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
    }

    // --------------------------------------------------------------- managers

    /// @notice Pay a supplier / expense. A receipt is mandatory.
    function spend(address to, uint256 amount, uint256 categoryId, string calldata receiptURI, string calldata note)
        external
        onlyManager
        nonReentrant
        returns (uint256 spendId)
    {
        if (amount == 0) revert ZeroAmount();
        if (bytes(receiptURI).length == 0) revert ReceiptRequired();
        _debit(categoryId, amount);

        spendId = _spends.length;
        _spends.push(Spend(msg.sender, to, uint64(block.timestamp), categoryId, amount, 0, receiptURI, note));
        totalSpent += amount;
        emit Spent(spendId, msg.sender, to, categoryId, amount, receiptURI, note);

        if (!token.transfer(to, amount)) revert TransferFailed();
    }

    /// @notice Pay aid directly to beneficiaries. Every recipient must be a
    /// GoodDollar-verified unique human, which rules out ghost beneficiaries.
    function payBeneficiaries(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 categoryId,
        string calldata receiptURI,
        string calldata note
    ) external onlyManager nonReentrant returns (uint256 spendId) {
        if (recipients.length != amounts.length || recipients.length == 0) revert LengthMismatch();
        if (bytes(receiptURI).length == 0) revert ReceiptRequired();

        address[] memory roots = new address[](recipients.length);
        uint256 sum;
        for (uint256 i; i < recipients.length; ++i) {
            if (amounts[i] == 0) revert ZeroAmount();
            address root = identity.getWhitelistedRoot(recipients[i]);
            if (root == address(0)) revert NotVerifiedHuman(recipients[i]);
            roots[i] = root;
            sum += amounts[i];
        }
        _debit(categoryId, sum);

        spendId = _spends.length;
        _spends.push(
            Spend(msg.sender, address(0), uint64(block.timestamp), categoryId, sum, recipients.length, receiptURI, note)
        );
        totalSpent += sum;
        totalToBeneficiaries += sum;
        emit Spent(spendId, msg.sender, address(0), categoryId, sum, receiptURI, note);

        Payout[] storage payouts = _payouts[spendId];
        for (uint256 i; i < recipients.length; ++i) {
            payouts.push(Payout(recipients[i], roots[i], amounts[i]));
            if (!_countedBeneficiaryRoot[roots[i]]) {
                _countedBeneficiaryRoot[roots[i]] = true;
                ++uniqueBeneficiaries;
            }
        }
        for (uint256 i; i < recipients.length; ++i) {
            emit BeneficiaryPaid(spendId, recipients[i], roots[i], amounts[i]);
            if (!token.transfer(recipients[i], amounts[i])) revert TransferFailed();
        }
    }

    // ------------------------------------------------------------------ admin

    function addCategory(string calldata name) external onlyAdmin returns (uint256 categoryId) {
        categoryId = _categories.length;
        _categories.push(name);
        emit CategoryAdded(categoryId, name);
    }

    function setManager(address account, bool enabled) external onlyAdmin {
        isManager[account] = enabled;
        emit ManagerSet(account, enabled);
    }

    function setMetadataURI(string calldata uri) external onlyAdmin {
        metadataURI = uri;
        emit MetadataUpdated(uri);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        pendingAdmin = newAdmin;
        emit AdminTransferStarted(admin, newAdmin);
    }

    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotAdmin();
        emit AdminTransferred(admin, msg.sender);
        admin = msg.sender;
        pendingAdmin = address(0);
    }

    // ------------------------------------------------------------------ views

    function isVerifiedHuman(address account) public view returns (bool) {
        return identity.getWhitelistedRoot(account) != address(0);
    }

    function categories() external view returns (string[] memory) {
        return _categories;
    }

    function categoryCount() external view returns (uint256) {
        return _categories.length;
    }

    function donationCount() external view returns (uint256) {
        return _donations.length;
    }

    function spendCount() external view returns (uint256) {
        return _spends.length;
    }

    /// @notice Newest-first page of donations.
    function getDonations(uint256 offset, uint256 limit) external view returns (Donation[] memory page) {
        uint256 n = _pageSize(_donations.length, offset, limit);
        page = new Donation[](n);
        for (uint256 i; i < n; ++i) page[i] = _donations[_donations.length - 1 - offset - i];
    }

    /// @notice Newest-first page of spends (expenses and beneficiary batches).
    function getSpends(uint256 offset, uint256 limit) external view returns (Spend[] memory page) {
        uint256 n = _pageSize(_spends.length, offset, limit);
        page = new Spend[](n);
        for (uint256 i; i < n; ++i) page[i] = _spends[_spends.length - 1 - offset - i];
    }

    function getPayouts(uint256 spendId) external view returns (Payout[] memory) {
        return _payouts[spendId];
    }

    /// @notice Unrestricted funds: General donations plus everything streamed in.
    function generalBalance() public view returns (uint256) {
        return token.balanceOf(address(this)) - totalEarmarked;
    }

    // --------------------------------------------------------------- internal

    /// @dev Spend from the category's earmarked funds first, then the General pool.
    function _debit(uint256 categoryId, uint256 amount) internal {
        if (categoryId >= _categories.length) revert InvalidCategory();
        uint256 general = generalBalance();
        uint256 fromEarmark = categoryId == GENERAL ? 0 : _min(earmarked[categoryId], amount);
        uint256 fromGeneral = amount - fromEarmark;
        if (fromGeneral > general) revert InsufficientFunds(general + fromEarmark, amount);

        if (fromEarmark != 0) {
            earmarked[categoryId] -= fromEarmark;
            totalEarmarked -= fromEarmark;
        }
    }

    function _pageSize(uint256 total, uint256 offset, uint256 limit) private pure returns (uint256) {
        if (offset >= total) return 0;
        return _min(total - offset, limit);
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
