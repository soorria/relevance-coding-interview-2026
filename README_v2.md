# Overview
We are building a basic service to help Relevance AI project admins better understand their agent usage statistics.

One eventual requirement we would like is being able to quickly identify a project's "power users".

We will build out this service in stages - there is no expectation to finish all tasks. Instead, focus on explaining your thought process and code design decisions to the interviewer.

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
    "OrganizationId": "org-0",
    "ProjectId": "fb5988f9-9a5a-446d-b5ec-1a88f3fcea5c",
    "Message": "Curse you Perry the Platypus.",
},
```
We want to consume these event logs as the source of truth for the `getUsers` and `getAgents` functions. We will read the logs from `src/logs`.

## Task 1
Implement these functions:
- `getUsers(projectId: string)` => `["u1", "u2"]`
  - Return unique list of userIds for the given project
- `getAgents(projectId: string)` => `["a1", "a2"]`
  - Return unique list of agentIds for the given project

## Task 2
Implement the "Power Users" function
- Create a new function `getPowerUsers(projectId: string)` which returns a list of users in the project that fulfill the following conditions:
  1. They have at least 5 events in the project
  2. They ran at least 2 different agents in the project

The function should return an array of user objects with relevant statistics, for example:
```typescript
[
  {
    userId: "u1",
    eventCount: 12,
    uniqueAgents: 3
  },
  // ...
]
```

## Task 3
We want to be able to compute the amount of revenue for a particular organization. In order to calculate this, we need to know the number of
active seats as well as the number of tokens consumed by the org. The number of active seats is defined as the number of users in the org
logs.

```
seat_revenue = (#users * $20)
revenue =  seat_revenue + token_revenue
```

For the purposes of this interview, a token is defined as the number of charactes in the message. For our bigger customers we would want to
give them a volume discount.

Example token pricing table:
```
[
    {
        threshold: 0,
        price: 1,
        unit: 1_000
    },
    {
        threshold: 100_000,
        price: 0.8,
        unit: 1_000
    },
    {
        threshold: 1_000_000,
        price: 0.7,
        unit: 1_000
    }
]
```

As an example, for an org with 50 users that consumes 2.5 million tokens, the token pricing will calculated as follows.
- For the first 100,000 tokens, the pricing would be $1*(100_000/1_000) = $100
- For the next 900,000 tokens, the pricing would be $0.8*(900_000/1_000) = $720
- For the next 1.5 million tokens, the pricing would be $0.7*(1_500_000/1_000) = $1050
- The seat pricing would be $20 * 50 = $1000

Total = $2870

# Extension
Since we charge organisations by per-user, customers with a lot of users but low usage would not get much
out of it. Therefore, for each onboarded user we will want to give a complimentary quota. For the purposes
of this task, each onboarded user will get 5,000 free tokens. To calculate the monthly total, we take the
total number of tokens, subtract it by the free tokens and then apply the balance to the token calculation
formula as above.

So for the previous example of an org of 50 users with 2.5 million tokens.
- We have a free quota of 50*5_000 = 250_000 tokens, therefore 2,250,000 tokens will be charged.
- For the first 100,000 tokens, the pricing would be $1*(100_000/1_000) = $100
- For the next 900,000 tokens, the pricing would be $0.8*(900_000/1_000) = $720
- For the next 1.25 million tokens, the pricing would be $0.7*(1_250_000/1_000) = $875
- The seat pricing would be $20 * 50 = $1000

Total = $2695

