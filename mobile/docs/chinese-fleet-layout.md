# Chinese DOS fleet trainer: verified layout and scope

All addresses include the file header for slot 1. Add `(slot - 1) * 32884` for slots 2–10. File size 328991, header 151. These addresses are **not** the English or Korean addresses.

| Table | Address | Stride / relevant fields |
|---|---|---|
| Protagonist ID | 0x06A8 | 0–5 |
| Sailors | 0x06A9 | 50; first/surname 13 bytes each; +28 eight stats; +36/+37 navigation/battle level; +38/+40 experience u16; +43 loyalty; +44 fleet; +46 role; +48 skill mask |
| Active companion roster | 0x220E | 30 IDs, FF empty; protagonist is separate |
| Fleet records | 0x2269 | 133; ship slots start +0x2B |
| Fleet ship slots | 0x2294 + fleet * 133 | ten 9-byte records: crew u16, hull, maxHull, turn, power, guns, instance ID, gun/status flags |
| Player supplies | 0x46C7 | 30 per fleet ship; water/food u16 tenths, lumber/shot u16, cargo quantities at +12 |
| Ship instances | 0x4C85 | 22: name 15, type +15, visual/material +16, gun capacity +17, crew capacity +18 u16, cargo +20 u16 |
| Default ship instances | instance 40–64 | read only; visual high nibble for each of 25 ship types |

The six protagonist fleet IDs are 0, 10, 30, 50, 40, 20. Edit only owned instances 0–39 referenced by an active player fleet slot. Reject duplicate/invalid references, unsupported file lengths, empty saves, mismatched membership, stale records and unknown fields. Never use an NPC ship template as an editable owned instance. Ship type changes preserve the material low nibble and copy only the selected type's visual high nibble.

Sources used as references:

- [JohanLi: Uncharted Waters II research](https://github.com/JohanLi/uncharted-waters-2-research): English save-format research, fleet slots, supply units and skills (MIT).
- [genishs: dh2-py-editor](https://github.com/genishs/dh2-py-editor): Korean Person/Ship1/Ship3 layouts, companion roster and visual nibble handling (MIT). Its Korean offsets and 25-byte ship instances do not apply here.
- [Dk2Edit original discussion](https://www.xycq.org.cn/forum/viewthread.php?page=1&tid=71167): feature discovery only. Its Windows executable is not bundled or executed.

Verification (2026-10-30): `fleet.test.cjs` checks isolated byte writes, every protagonist's fleet marker, last save slot, preserved ownership/names/skill high bits, stale/invalid data and capacity constraints. `fleet-runtime.cjs` runs the real DOS engine in Chromium, using a synthetic owned ship/companion inserted into a freshly saved Chinese game **only as a test fixture**. The UI applies multiple category edits in one backed-up transaction. Native game ship information displayed Tekkousen, 99/100 hull, 97/80 turning, 98/85 power, 120/300 crew, 800 cargo. Native sailor information displayed seven visible stats 100, levels 50/45 and all five skills. Luck and loyalty were checked in the save; experience and identity bytes remained unchanged. `fleet-roundtrip.cjs` verified native re-save retention, invalid-edit atomicity and byte-identical complete backup restoration.

Limitations: no Android device run; no full campaign, all ship models or every companion tested in the engine. Original Chinese name encoding is preserved and not decoded; the mobile form uses role, level and record ID. Ship/current-stat edits may exceed a ship model's standard value; the original game can recalculate values during repairs/refits or play. No default edits, forced recruitment, new ship creation, story flags, global template edits or experience changes are shipped. No game saves are included in Git or APK assets. Unit test records are generated in code; engine acceptance tests require `UW2_TEST_SAVE` pointing to a local Chinese Al start save in record 2.
