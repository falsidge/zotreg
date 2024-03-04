# ZotReg
Make WebReg bearable to use.

# Setup
```cmd
npm install
npm run build
```

Open Firefox and navigate to `about:debugging` -> This Firefox -> Load Temporary Add-On...
Select the `manifest.json` file in the build directory and import it
Make sure to enable the permissions for `reg.uci.edu` in the extension under `about:addons` as well (this isn't on by default in Manifest v3 for some reason)

# Roadmap
- Import a schedule from ZotCourse and register for it in WebReg
- Allow the schedule to be ordered by priority
- Allow changing grade mode, variable units, and authorization codes
- At some point, just fork from ZotCourse (maybe this can be entirely serverless?)
    - There's not enough features in ZotCourse
    - No way to change grade mode or variable units or add an auth code
    - No way to require a certain "set" of classes
    - No way to warn of schedules overlapping
    - No way to export a ZotCourse schedule to a URL or save it to disk (only on the server? weird design)

