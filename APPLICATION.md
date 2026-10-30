# GoodBuilders Season 5 — ClearGive application draft

Fill in everything marked `[TODO]` before submitting.

---

## Project tab

### 1. Admin
- **Project Name:** ClearGive
- **Manager Addresses:** your wallet (auto-filled) + `[TODO teammate wallet]`
- **Default Funding Address:** `[TODO — a Safe on Celo is recommended over your personal EOA]`

### 2. Basics
**Description** (≈950 characters, min. 200):

> ClearGive makes church and NGO giving transparent, on Celo, with G$.
>
> Each organisation gets a public on-chain vault. Donors give once or stream G$ monthly through Superfluid, and can earmark gifts to a budget category like "School fees" or "Building fund". That money can only be spent on that category.
>
> Funds can only leave the vault with a receipt attached (an invoice or photo on IPFS). Every donation, spend and receipt appears on a public ledger anyone can check.
>
> When an NGO pays aid directly to people, ClearGive only pays wallets verified as unique humans with GoodDollar identity. This makes ghost beneficiaries, one of the most common forms of aid fraud, impossible on-chain.
>
> Donors come back to see what their giving did. Organisations come back because posting receipts is how they unlock their funds.

- **Logo:** `[TODO 1:1 PNG, max 256KB]`
- **Banner:** `[TODO 3:1, max 1MB — a screenshot of the org page works]`
- **Website:** `[TODO deployed URL, e.g. Vercel]`
- **Demo/Application Link:** `[TODO link to the pilot org page]`

### 3. Social
`[TODO X / Farcaster / Telegram]`. A Telegram group for pilot treasurers is useful.

### 4. Technical
- **GitHub:** `[TODO push repo]`
- **Smart Contracts (Celo):**
  - ClearGiveRegistry — `[TODO after deploy]`
  - Pilot org vault(s) — `[TODO]`

### 5. Additional
- Pilot partner letter or post from the church/NGO, if you have one.

---

## Round answers (GoodBuilders-specific)

### What value does your product create, and how can G$ support it?
Donors to churches and NGOs often can't see where their money goes. Organisations that are honest have no cheap way to prove it. ClearGive gives every organisation a public G$ vault where inflows, outflows and receipts are all on-chain.

G$ isn't just the payment rail:
1. **GoodDollar identity is the core anti-fraud feature.** Beneficiary payouts only go to verified unique humans, and the contract reverts the whole batch otherwise. The public page shows "paid to N unique verified people", counted by identity root rather than by wallet.
2. **Superfluid streaming G$** turns tithes and monthly pledges into recurring giving that anyone can see and donors can stop at any time.
3. **Verified donors.** Donations from GoodID-verified wallets are flagged, so organisations can show real community support rather than one whale.
4. **Recirculation.** Beneficiaries receive G$ that they also claim daily as UBI, which keeps value inside the G$ economy.

### G$ integration
- `ClearGiveVault.payBeneficiaries` calls GoodID `getWhitelistedRoot` for each recipient and reverts if any isn't verified.
- G$ streams to vaults via CFAv1Forwarder `setFlowrate`. The vault reads streamed funds into its General balance, and the page shows the live monthly inflow.
- Each donation calls GoodID to record whether the donor is a verified human, and the vault counts unique verified donors by identity root.

### Why users come back (beyond rewards)
- **Donors:** they return to see receipts and what their giving did. Monthly streams keep them giving without any reminder.
- **Treasurers:** posting a receipt is the only way to move money, so the habit is built into the product.
- **Beneficiaries:** recurring support such as school fees each term arrives as G$ in a wallet they already use for UBI.

### Status
Contracts are tested, including against real G$ and GoodID on a Celo mainnet fork. The web app is working: org registration, one-time and streamed donations, earmarks, spends with receipts, and verified beneficiary payouts. Mainnet deploy: `[TODO date]`.
Pilot partner(s): `[TODO name of church / NGO, city, size]`.

### Season goals (by end of season)
| Metric | Target | How it's verified |
|---|---|---|
| Organisations live with a funded vault | 5 (2 pilots by week 2) | Registry `orgCount`, vault balances |
| Unique donors | 150, of which 60 GoodID-verified | `Donated` events, `uniqueVerifiedDonors` |
| Active monthly G$ streams | 40 | Superfluid subgraph / `getAccountFlowrate` |
| G$ donated + streamed | `[TODO e.g. 2,000,000 G$]` | Vault inflows |
| % of outflow with a receipt | 100% (enforced by contract) | `Spent` events |
| Unique verified beneficiaries paid | 200 | `uniqueBeneficiaries` |
| Donor 30-day retention | 35% give again or keep streaming | On-chain donor history |

### Two-week targets
| Weeks | Target |
|---|---|
| 1–2 | Mainnet deploy and verify; onboard pilot #1; first 20 donors; first receipt-backed spend |
| 3–4 | Pilot #2 (NGO with beneficiary payouts); first verified payout batch; receipt upload backend |
| 5–6 | Monthly-giving campaign with pilots; 15 active streams; shareable impact cards for donors |
| 7–8 | Orgs 3–4; GoodWallet/MiniPay-friendly donate flow; donor notifications when receipts post |
| 9–10 | Org 5; public "transparency score" per org; 30-day retention review |
| 11–12 | Demo Day: full season numbers, case study from a pilot |

### Commitment
Yes to two-week targets, weekly 1:1s, every Demo Day, and progress updates on Flow State.
