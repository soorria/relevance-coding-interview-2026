# Overview

We are building a basic API service to allow Relevance AI project admins better understand their agent usage statistics.

One eventual requirement we would like is being able to quickly list a project's "power users".

We will build out this API in stages, there is no expectation to finish all tasks - instead focus on explaining your thought process and code design decisions to the interviewer.

## Setup

1. `npm install`
2. `npm run genlogs`
3. `npm run dev` (hot reload enabled)

## Task 1

Implement new API endpoints in `index.ts`:

- GET `/users` => ["u1", "u2"]
  - Return unique list of userIds
- GET `/agents` => ["a1", "a2"]
  - Return unique list of agentIds

### Data

Whenever a customer runs an AI agent task, we record an event in jsonl log files which rotate daily. Each event looks like the following:

```json
{
    "Timestamp": "2025-11-04T12:00+10:00",
    "AgentId": "agent-67",
    "User": {
      "Id": "u1",
      "Email": "jeffyb@amazon.com",
      "Name": "Jeffy B",
    },
    "ProjectId": "fb5988f9-9a5a-446d-b5ec-1a88f3fcea5c",
    "Message": "Curse you Perry the Platypus.",
},
```

We want to consume these event logs as the source of truth for `/users` and `/agents` requests. We will read the logs from `src/logs`.

Run `npm run genlogs` to re-generate some sample logs under `src/logs/`.

- See the partially implemented helper in `load-logs.ts` for loading the json array into the program.
- Feel free to create your own log data for testing.

You may use the provided sqlite DB or implement your own data structures to serve the requests.

- For now, it's fine to just return a list of ALL the unique UserId or AgentId in ALL the logs (regardless of `ProjectId`)

## Task 2

Scope all requests to a specific project based on an auth token.

- Let's assume all requests will have this basic Bearer token in the request headers
  - `{ Authorization: Bearer <ProjectId> }`
  - This request should return UserIds from events where `ProjectId == "project123"`:
    ```
    curl -X GET "http://localhost:3000/users" \
      -H "Authorization: Bearer project123"
    ```
- All requests without an Authorization header should be rejected with status 403

## Task 3

Implement the "Power Users" endpoint

- create a new endpoint `/power-users`, which lists users in your project that fulfill the following conditions
  1. they have at least 5 events in the project
  2. they ran at least 2 different agents in the project
