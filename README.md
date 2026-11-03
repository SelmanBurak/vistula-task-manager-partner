# Task Manager

A basic Task Manager for the Vistula Team Project. The application uses HTML, CSS, JavaScript, GitHub Pages, and the Supabase REST API.

## Student and deployment

- Student ID: `73681`
- GitHub repository: `https://github.com/vistula-team-project-73681/vistula-task-manager`
- Live application: `https://vistula-team-project-73681.github.io/vistula-task-manager/`
- Incoming contribution Pull Request from Selman (student ID `72922`): pending
- Outgoing contribution Pull Request to Selman's repository: [#1](https://github.com/SelmanBurak/vistula-task-manager/pull/1) (awaiting review and merge)

## Supabase setup

Create a `tasks` table with an identity primary key named `id`, a required text column named `title`, a text column named `description`, and a boolean column named `completed` with a default of `false`. Add the public demonstration CRUD policies required by the assignment, then set `supabaseUrl` and the public publishable key in `config.json`.

Only a public publishable key belongs in this frontend configuration. Never add a secret or service-role key.

## Files

- `index.html` — Task Manager page
- `app.js` — Supabase REST API operations and task rendering
- `style.css` — page styling
- `config.json` — Supabase URL and public publishable key
- `contribution.html` and `contribution.json` — supplied by the partner through a Pull Request

