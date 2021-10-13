# Jekyll Tester
Test to ensure PRs to Jekyll Static sites will successfully build

You must have Ruby, and Node 12+ installed in your workflow before running this action

Add to your file with the following:
```yml
- name: Test Jekyll
  uses: epstechtheatre/Jekyll-Tester@v1.2.0
  with:
    path: your/optional/path
  env:
    LC_ALL: "C.UTF-8"
    LANG: "en_US.UTF-8"
    LANGUAGE: "en_US.UTF-8"
```

Full workflow example:
```yml
name: Jekyll Tester
on: [pull_request_target]

jobs:
  Test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1.82.0
        with:
          ruby-version: 3.0

      - name: Install Node 16
        uses: actions/setup-node@v2
        with:
          node-version: 16

      - name: Test Jekyll
        uses: epstechtheatre/Jekyll-Tester@v1.2.0
        with:
          path: your/optional/path
        env:
          LC_ALL: "C.UTF-8"
          LANG: "en_US.UTF-8"
          LANGUAGE: "en_US.UTF-8"

```
