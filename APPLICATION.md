# ClearGive — GoodBuilders Season 5 application

Copy each answer into the matching box on Flow State. Only the lines marked **✏️ FILL IN** need your own details. Everything else is ready to paste.

---

## Project Information

**Project Name**
ClearGive

**Manager Addresses**
✏️ FILL IN: your MetaMask address (starts with 0x)

**Description** (paste everything between the lines)

---
**ClearGive makes church and NGO giving transparent, on Celo, with G$.**

People give to churches and NGOs every week but rarely see where the money goes. Honest organisations have no cheap way to prove how they spend it, and aid programmes lose money to "ghost beneficiaries", people on the list who don't exist.

ClearGive gives every organisation a public on-chain vault:

- **Every donation is public.** Donors give G$ once, or monthly through a Superfluid stream they can stop at any time.
- **Earmarked giving.** A donor can give to a budget category such as "School fees" or "Building fund". The contract only allows that money to be spent on that category.
- **No receipt, no spending.** Money can only leave the vault with a receipt attached (an invoice or photo). Every spend and receipt appears on a public ledger anyone can check.
- **Ghost-proof aid.** When an NGO pays people directly, ClearGive only pays wallets verified as unique humans with GoodDollar identity (GoodID). If any wallet isn't verified, the whole payment is rejected.
- **Verified donors.** Gifts from GoodID-verified wallets are marked, so an organisation can show real community support.

Donors come back to see what their giving did. Treasurers come back because posting a receipt is the only way to use the funds.

A working demo is live on the Celo test network, with a demo church showing donations, a receipt-backed spend and a payment to two verified people.
---

**Logo**
Upload `brand/logo.png` from the GitHub repo.

**Banner**
Upload `brand/banner.png` from the GitHub repo.

**Website**
https://cleargive.netlify.app

**Demo URL**
https://cleargive.netlify.app/#/org/0

**X/Twitter, Farcaster, Telegram, Discord**
Leave empty, or ✏️ FILL IN if you have any.

**GitHub Repos**
https://github.com/MavDavis/cleargive

**Smart Contracts** (Celo Sepolia testnet; mainnet after funding)
- ClearGiveRegistry: `0xDD4F851168392bc375e19AAF81554aaE5C82e68f`
- Demo organisation vault: `0xf4dD8cE5C8aECeE8D9FFeb933B02d12c2107C1AE`

**Other Links**
- Label: `Demo transactions (block explorer)`, URL: https://celo-sepolia.blockscout.com/address/0xf4dD8cE5C8aECeE8D9FFeb933B02d12c2107C1AE

**Wallet to receive funding**
✏️ FILL IN: your MetaMask address (the same one as above is fine)

---

## 1. Previous Participation

**1.1 Have you participated in GoodBuilders before?** No

**1.2 Number of Seasons** 0

**1.3 Previous Karma Updates** Leave empty

**1.4 What's the current state of your project today?**
ClearGive is a working prototype. The smart contracts are written and tested, including tests against the real G$ token and GoodID contracts on a copy of Celo mainnet. The web app is live at cleargive.netlify.app and runs on the Celo Sepolia test network, with a demo church showing donations, earmarked giving, a spend with a receipt, and a payment to two verified people. Next steps are deploying to Celo mainnet and onboarding the first real church and NGO.

## 2. Maturity & Usage

**2.1 Project Stage** Choose the option closest to "Prototype" or "MVP"

**2.2 Lifetime Users** 0

**2.3 Active Users** 0

**2.4 Active Users Frequency** Weekly

**2.5 GoodDollar-verified users today** 0

**2.6 On-chain transactions to date** 0
(Mainnet is 0. The 16 test-network transactions are mentioned in 2.9.)

**2.7 Revenue earned to date** 0

**2.8 Where do you track these numbers?**
https://celo-sepolia.blockscout.com/address/0xDD4F851168392bc375e19AAF81554aaE5C82e68f

**2.9 Other relevant usage data**
No real users yet. The demo on the Celo Sepolia test network has 16 successful transactions: deploying the contracts, creating a demo organisation, 3 donations (one earmarked for school fees, one for a building fund), a spend with a receipt, and a payment to 2 verified people. All usage data is on-chain and readable directly from the vault contracts, so it can be checked without trusting us.

## 3. Integration

**3.1 G$ Integration Status** Choose "In progress" (or the closest option)

**3.2 Integration Type** Select all that match: payments / donations, GoodDollar identity (GoodID), streaming (Superfluid)

**3.3 Describe your G$ integration & why it matters**
All giving on ClearGive is in G$, either one-time or as monthly Superfluid G$ streams into each organisation's vault. GoodID is the core anti-fraud feature: aid payments only go to GoodID-verified unique humans, so ghost beneficiaries are impossible, and verified donors are marked publicly. People who receive aid get G$ in the same wallet they claim their daily UBI with, which keeps value circulating in the G$ economy.

## 4. What you'll build

**4.1 Primary Build Goal**
Launch ClearGive on Celo mainnet and run it with real churches and NGOs, so their G$ donations, receipts and verified aid payments are publicly visible.

**4.2 Build Milestones**

| Deliverable | Estimated completion |
|---|---|
| Deploy contracts to Celo mainnet and verify them on Celoscan | 23 Nov 2026 |
| Receipt upload backend (photos and invoices to IPFS without the treasurer needing a key) | 7 Dec 2026 |
| Shareable "impact card" for donors, showing what their gift paid for | 21 Dec 2026 |
| Donor notifications when an organisation posts a new receipt | 11 Jan 2027 |
| Public transparency score for each organisation (share of spending with receipts, verified payouts) | 25 Jan 2027 |

**4.3 Ecosystem Impact**
ClearGive brings churches and NGOs, with their existing communities of givers, into G$, and gives aid recipients a reason to verify with GoodID and claim UBI.

## 5. Your Product in Action

**5.1 Reason to return**
Donors come back to see receipts and what their giving achieved, and monthly streams keep them giving without a reminder. Treasurers come back because posting a receipt is the only way to use the organisation's funds. Aid recipients come back because support such as school fees arrives every term in the wallet they already use for UBI.

**5.2 Target: weekly retention by the end of the season (%)** 30

**5.3 Weekly retention today** 0

**5.4 Getting G$: how do users earn G$ in your product?**
Verified aid recipients receive G$ directly from organisations, for example school fees or food support. Organisations receive G$ donations and streams from their communities.

**5.5 Target: users earning G$ by the end of the season** 30

**5.6 Users earning G$ today** 0

**5.7 G$ used inside your product so far** 0

**5.8 Use: how do users spend, unlock or share G$ inside your product?**
Donors give G$ to organisations once or as a monthly stream, and can earmark it for a specific cause. Organisations spend G$ on suppliers with a receipt attached, or pay it directly to verified people.

**5.9 Target: G$ used inside your product by the end of the season** 500000

**5.10 New ideas: what new ways will users be able to use G$ this season?**
Monthly G$ tithes and pledges as Superfluid streams, donating G$ to a specific budget line such as school fees, and group payouts to verified beneficiaries in one transaction.

## 6. How you'll grow

**6.1 Primary Growth Goal**
Onboard 3 real churches or NGOs that receive G$ donations and publish every spend with a receipt on ClearGive.

**6.2 Target: communities or partners onboarded** 3

**6.3 What campaigns will drive this growth?**
Direct outreach to churches and NGOs in my local community, starting with ones I already know. Each pilot organisation will run a "Give in G$" Sunday or campaign day where members are helped to verify with GoodDollar, claim UBI, and make a first donation. Every receipt posted becomes shareable proof for donors, which brings in new givers.

**6.4 Growth Milestones**

| Milestone | Estimated completion |
|---|---|
| First real organisation registered on mainnet | 30 Nov 2026 |
| First "Give in G$" campaign day with the pilot organisation | 14 Dec 2026 |
| Second organisation onboarded, first verified aid payout on mainnet | 11 Jan 2027 |
| Third organisation onboarded | 1 Feb 2027 |

**6.5 Ecosystem Impact**
Each organisation brings a ready-made community of givers and recipients, which means new GoodID-verified users and new daily UBI claimers for GoodDollar.

**6.6 Sustainability plan** Leave empty (this is for returning teams)

**6.7 Target GoodDollar-verified users** 50

**6.8 Target: Active users** 60

**6.9 Target: on-chain transactions** 500

**6.10 Target: Revenue** Leave empty

## 7. Team

**7.1 Primary Contact Name** ✏️ FILL IN: your full name

**7.2 Primary Contact Role Description**
Founder and full-stack developer. I build the Solidity smart contracts and the React web app, and I lead outreach to churches and NGOs.

**7.3 Primary Contact Telegram** ✏️ FILL IN: your Telegram username

**7.4 Primary Contact GitHub or LinkedIn** https://github.com/MavDavis

**7.5 Additional Teammates** Leave empty (solo builder)

## 8. Additional

**8.1 Additional comments**
ClearGive currently runs on the Celo test network because the mainnet deployment needs CELO for fees. Moving to mainnet is the first milestone and is a single configuration change; the contracts have already been tested against the real G$ and GoodID contracts.

**8.2 Where did you hear about the GoodBuilders Program?** ✏️ Choose the option that's true for you

---

## Attestation

Tick **Yes** on all of these:
- 1.1 Commitment (progress updates, Demo Days, office hours, KPI data)
- 2.6 Built on Celo and verifiable on-chain
- 2.7 Source code is public
- 2.8 Agree to pass KYC
- 3.1 Data consent
- 4.1 Privacy & transparency terms

Fill in yourself (these must match your ID for KYC):
- **2.1 Recipient Type** ✏️ "Individual"
- **2.2 Legal Name** ✏️ your name as on your ID
- **2.3 Country of residence** ✏️
- **2.4 Address** ✏️ your home address
- **2.5 Contact Email** ✏️
