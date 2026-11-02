# 0.7 equipment, map and illustrations

References: JohanLi/uncharted-waters-2-research `game-details/ports.md`, `game-details/at-sea.md`, `game-details/dueling.md`, `scripts/art/graph-format.ts`, `save-editor/format.ts` (MIT notice retained). Chinese layout verified against locally generated original-game record 2; no test save is tracked or bundled.

Addresses are absolute for record 1; add `(slot-1)*32884`.

- Inventory: `0x224A`, 20 byte IDs, FF empty. Items: `0x763B`, 100 records of 20 bytes; +18 rating, +19 category low nibble / equipped bit 0x10. Name, price, quest items and unrelated flags stay intact. Add selected equipment to an empty slot if absent; refuse full inventory. Only chosen equipment category is unequipped, then selected item equipped. No inventory overwrite preset.
- Ports: `0x5347`, 130 × 22 bytes; +21 bit 0x10 known. All 130 coordinate pairs matched the research version despite different localized record length. Visited, nationality and hidden/story flags preserved.
- Chart: `0x1DB`, 45 rows × 12 bytes, 90 meaningful bits per row; charted count u16 at `0x401` set to 4050. Unreported count at `0x403` preserved; no automatic gold/fame rewards.
- Discoveries: `0x737F`, 98 × 7 bytes. For content +4 <90 only, clear unselected 0x80 and set sighted 0x40 at +6. Preserve found/reported flags and all 10 treasure records (content >=90). This explicitly enables ordinary villages absent from the original random selection; it does not complete their discoveries.
- Ship models: `0x521B`, 25 × 12 bytes; industry×10, durability, turning, propulsion, maximum crew/10, minimum crew, total capacity u16, maximum guns. Model values shown as reference, not automatically written when changing a ship type.
- GRAPH.DAT records 28–52 are the 25 illustrations. `prepare-catalog.cjs` decodes original local APK assets at build time. Generated pictures remain under ignored APK assets, not source Git history. Decoder adapted from the MIT reference; no AI illustrations replace original ships.

Verification: 20 Node tests (17 prior + 3 equipment/map tests) pass. Browser DOS runtime applied sword 76 and armor 75, displayed the fully charted world, and native re-save preserved equipment plus 130 known ports and 88 ordinary villages. Treasure records and reward counters checked for preservation. Offline guide images loaded, guide closed to gameplay, direct/trackpad action-button switching checked. Android device and long campaign validation remain pending.

Button semantics: confirm sends Enter (Space in battle/duel); back sends Escape; mouse buttons operate cursor location. They are not identical. Direct mode shows confirm/back, trackpad mode left/right. Trainer is a top-level button beside menu. Guide is in menu and pauses/resumes the engine through the same modal owner lifecycle.
