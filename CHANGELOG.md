# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1]

Initial release

## [0.0.2] 

### Added
- Include categories in search
- Persist filters across sessions by syncing them to the storage

### Changed

- Improved filter layout: Moved to overlay to give a more scannable experience
- Improved loginlist design: moved secondary buttons to menu, more room for important content, added tag display to menu

## [0.0.3]

### Added

- Added loader during startup and other longer async tasks

### Fixed

- Fixed categories not updating when a remote list is used
- Fixed search breaking when description is undefined


## [0.0.4] - 2022-08-17

### Added

- Add button to delete all remote logins

### Fixed

- Fix JSON uploaded not being synced, when file is too large (Now stored locally)

## [1.0.0] - 2022-08-26

### Added 

- Now also supports Firefox (and maybe Safari?)
- Options are now opennable in a new tab

### Changed

- Go back to Manifest v2 to support Firefox
- Use content script instead of scripting API
- Only request access to URLs that are actually fetched
