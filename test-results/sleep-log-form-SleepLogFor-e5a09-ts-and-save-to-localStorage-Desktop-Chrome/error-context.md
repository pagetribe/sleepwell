# Page snapshot

```yaml
- main:
  - tabpanel:
    - heading "Sleep History" [level=2]
    - 'heading "Tuesday, August 12 In Progress bed: 10:00 pm, woke at 6:30 am -" [level=3]':
      - 'button "Tuesday, August 12 In Progress bed: 10:00 pm, woke at 6:30 am -" [expanded]':
        - text: Tuesday, August 12
        - img
        - text: "In Progress bed: 10:00 pm, woke at 6:30 am -"
        - img
    - 'region "Tuesday, August 12 In Progress bed: 10:00 pm, woke at 6:30 am -"':
      - heading "Morning" [level=4]:
        - img
        - text: Morning
      - text: "Woke: 6:30 am Wake-up mood: - Fuzziness: - Mid-dream: No Morning notes: Finished a great book tonight."
      - heading "Evening" [level=4]:
        - img
        - text: Evening
      - text: "Bed: 10:00 pm Daytime mood: 5/5 Evening notes: No notes"
      - button "Edit":
        - text: Edit
        - img
      - button "Delete":
        - img
        - text: Delete
- tablist:
  - tab:
    - img
  - tab [selected]:
    - img
  - tab:
    - img
- region "Notifications (F8)":
  - list
- alert
- button "Open Next.js Dev Tools":
  - img
```