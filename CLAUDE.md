# 프로젝트 지침

## 불필요한 코드 보고 방식

"필요없는 코드 보고해" 요청 시 아래 형식을 따른다.

### Report Format

1. **Item found** — file path, line number(s), and name of the code
2. **What it does** — one-line summary of what the code originally does
3. **Why it was created** — the reason it was introduced
4. **Why it is no longer needed** — which change removed all call/reference paths to it
5. **Code confirmed clean** — a table of files reviewed but found to have no issues

### Criteria for Reporting

- Symbols that are imported but never used
- Functions or variables that are exported but never imported anywhere
- Functions whose only call sites were removed by another change
- Fields in a data structure that were only referenced by dead code

### Rules

- Do not report code just because a better approach exists.
- Only report code that has no reachable call or reference path.
- Do not execute deletions until the user confirms.
