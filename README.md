# CCC Management Interface

Web app to manage content on the cookbook.

It's Next.js with React + TailwindCSS, while interacting with a Google Firestore database.

## Setup

1. See the "installation" section of [this](https://github.com/creativecomputingcookbook/cwp-11ty/wiki/Development-Environment-Setup).
2. See the "Google Firestore setup" section of the above page, but with a credential that allows writing into the database. (TODO: I need to make a credential that does that)
3. For development purposes it is sufficient to run `npm run dev`. For production, run `npm run build` then `npm run start`.

## Features

Existing and todo...

- [x] Generate form from schema
- [x] Write into database
- [ ] Read a list of pages from database
- [ ] Allow editing a page (by prefilling existing content)
- [ ] CRUD tags
- [ ] Integrate suggested tags
- [ ] Parsons preview
- [ ] Authentication

### Future stuff

Well, someone needs to style this...

Other than that... The assumption is to run the entire app on a e2-micro instance, but if budgetary constraints warrant, it might be necessary to split this into frontend & backend, so that the frontend can be run on a static host while the backend can be a Cloud Run function. Hence to the maximum extent possible, the API endpoints should not mix with frontend.

Also this probably needs to be open sourced...
