import { parseAbi } from 'viem'

export const registryAbi = parseAbi([
  'struct Org { address vault; string name; bool reviewed; uint64 createdAt; }',
  'function createOrg(string name, string metadataURI, address admin) returns (uint256 orgId, address vault)',
  'function getOrgs() view returns (Org[])',
  'function getOrg(uint256 orgId) view returns (Org)',
  'event OrgCreated(uint256 indexed orgId, address indexed vault, address indexed admin, string name, string metadataURI)',
])

export const vaultAbi = parseAbi([
  'function donate(uint256 amount, uint256 categoryId, string memo)',
  'function spend(address to, uint256 amount, uint256 categoryId, string receiptURI, string note) returns (uint256)',
  'function payBeneficiaries(address[] recipients, uint256[] amounts, uint256 categoryId, string receiptURI, string note) returns (uint256)',
  'function addCategory(string name) returns (uint256)',
  'function setManager(address account, bool enabled)',
  'function admin() view returns (address)',
  'function isManager(address) view returns (bool)',
  'function metadataURI() view returns (string)',
  'function categories() view returns (string[])',
  'function earmarked(uint256) view returns (uint256)',
  'function generalBalance() view returns (uint256)',
  'function totalDonated() view returns (uint256)',
  'function totalSpent() view returns (uint256)',
  'function totalToBeneficiaries() view returns (uint256)',
  'function isVerifiedHuman(address) view returns (bool)',
  'struct Donation { address donor; uint64 timestamp; bool verifiedHuman; uint256 categoryId; uint256 amount; string memo; }',
  'struct Spend { address by; address to; uint64 timestamp; uint256 categoryId; uint256 amount; uint256 beneficiaryCount; string receiptURI; string note; }',
  'struct Payout { address beneficiary; address identityRoot; uint256 amount; }',
  'function spendCount() view returns (uint256)',
  'function donationCount() view returns (uint256)',
  'function uniqueVerifiedDonors() view returns (uint256)',
  'function uniqueBeneficiaries() view returns (uint256)',
  'function getDonations(uint256 offset, uint256 limit) view returns (Donation[])',
  'function getSpends(uint256 offset, uint256 limit) view returns (Spend[])',
  'function getPayouts(uint256 spendId) view returns (Payout[])',
  'event Donated(address indexed donor, uint256 indexed categoryId, uint256 amount, bool verifiedHuman, string memo)',
  'event Spent(uint256 indexed spendId, address indexed by, address indexed to, uint256 categoryId, uint256 amount, string receiptURI, string note)',
  'event BeneficiaryPaid(uint256 indexed spendId, address indexed beneficiary, address indexed identityRoot, uint256 amount)',
])

export const erc20Abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
])

export const cfaForwarderAbi = parseAbi([
  'function setFlowrate(address token, address receiver, int96 flowrate) returns (bool)',
  'function getFlowrate(address token, address sender, address receiver) view returns (int96)',
  'function getAccountFlowrate(address token, address account) view returns (int96)',
])
