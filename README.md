![TestAccountManager header image](header.jpg)
# Testaccount Manager

Simple testaccount manager or password manager (like the ones you already use) for Chromium based browsers.

## Features

- Allows uploading passwords in JSON format (format further below)
- Allows adding a remote URL (JSON data), which will be automatically downloaded and added to the list of passwords
- Syncs settings and uploaded passwords to your Chromium browser / profile
- Otherwise the same functionality:
    - Allows searching for passwords
    - Categories for helping find specific password
    - Copy credentials
    - Autofill / Autologin

## Login Format

```js
/**
 * @typedef {{
 *  username: string;
 *  password: string;
 *  description: string;
 *  categories: Record<string, string>;
 * }} Login
 */
```

An example would be:

```json
{
  "username": "your_mom@hotmail.com",
  "password": "your_mom_password",
  "description": "This is your mom's email address",
  "categories": {
    "family": "true",
    "gender": "non-descriptive"
  }
}
```

### Motivation

We need a simple way to share multiple login credentials with our team for testing and development purposes.
This allows us to keep a centralised JSON up to date / fill it with specific credentials and have it synced without
sending the JSON around or sending specific login details to multiple people.

Our usecase also shaped the structure of the JSON file / login. We hope it will be useful for other people as well.

Oh yeah, also we wanted to try creating an extension for Chromium.

### Credits

- Styles used from [https://open-props.style/](https://open-props.style/)
- Icons from [BoxIcons](https://boxicons.com/)
