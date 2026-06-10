import { mkdir, writeFile } from "fs/promises";
import { randEmail, randFirstName, randFullName, randLastName, randSentence, seed } from "@ngneat/falso";

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function bisectLeft<T>(
  arr: T[],
  value: number,
  accessor: (t: T) => number,
  lo = 0,
  hi = arr.length,
) {
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (accessor(arr[mid]) < value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type LogEntry = {
  Timestamp: string;
  AgentId: string;
  User: {
    Id: string;
    Email: string;
    Name: string;
  };
  ProjectId: string;
  Message: string;
};

type Params = {
  records_per_day: number;
  users: number;
  agents: number;
  projects: number;
  organizations: number;
  start_date: Date;
  end_date: Date;
};

function getUserId(orgId: number, userId: number) {
  if (orgId === 0 && userId === 0) {
    return "jeffy-b";
  }
  if (orgId === 1 && userId === 1) {
    return "melon-husk";
  }

  return `user-${orgId + 1}-${userId + 1}`;
}

const userDetailsMap = new Map<
  string,
  { Id: string; Email: string; Name: string }
>();
function getUserDetails(orgId: number, userId: number): LogEntry["User"] {
  const uid = getUserId(orgId, userId);
  const details = userDetailsMap.get(uid)!;

  if (details) {
    return details;
  }

  const fName = randFirstName();
  const lName = randLastName();

  const newDetails = {
    Id: uid,
    Email: randEmail({
      provider: `org-${orgId+1}`,
      suffix: 'com',
      firstName: fName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      lastName: lName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }),
    Name: `${fName} ${lName}`,
  };

  userDetailsMap.set(uid, newDetails);

  return newDetails;
}

async function main(
  seed: readonly [number, number, number, number],
  params: Params,
) {
  console.log("Generating logs based on seed", seed, "and params", params);
  const rand = sfc32(...seed);
  const organizations = new Array(params.organizations).fill(0).map(() => ({
    projects: new Array(Math.floor(rand() * (params.organizations + 1)))
      .fill(0)
      .map(() => Math.floor(rand() * (params.agents + 1))),
    users: Math.floor(rand() * (params.users + 1)),
  }));
  let sum = 0;
  const orgIdWeights = organizations.map((x) => {
    sum += x.users;
    return x.users;
  });
  let running = 0;
  const compressed: [number, number][] = [];
  for (let i = 0; i < orgIdWeights.length; i++) {
    running += orgIdWeights[i];
    compressed.push([running / sum, orgIdWeights[i] / sum]);
  }

  const diffTime = Math.abs(
    params.start_date.getTime() - params.end_date.getTime(),
  );
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  await mkdir("src/logs", { recursive: true });
  for (let entry = 0; entry < days; entry++) {
    const base = Math.floor(params.records_per_day / 3);
    const num = Math.floor(rand() * base * 2) + base;
    const begin = new Date(
      Date.UTC(
        params.start_date.getUTCFullYear(),
        params.start_date.getUTCMonth(),
        params.start_date.getUTCDate() + entry,
      ),
    );
    const records: LogEntry[] = new Array(num).fill(0).map(() => {
      const r = rand();
      const orgId = bisectLeft(compressed, r, (x) => x[0]);
      const userId = Math.ceil(organizations[orgId].users * rand());
      const projectId = Math.floor(
        rand() * organizations[orgId].projects.length,
      );
      const agentId = Math.floor(
        rand() * organizations[orgId].projects[projectId],
      );
      const userDetails = getUserDetails(orgId, userId);
      return {
        AgentId: `agent-${orgId + 1}-${projectId + 1}-${agentId + 1}`,
        Timestamp: new Date(
          begin.getTime() + Math.floor(rand() * 86_400_000),
        ).toISOString(),
        User: userDetails,
        OrganizationId: `org-${orgId + 1}`,
        ProjectId: `project-${orgId + 1}-${projectId + 1}`,
        Message: randSentence(),
      };
    });
    records.sort((a, b) => a.Timestamp.localeCompare(b.Timestamp));
    await writeFile(
      `src/logs/${formatDate(begin)}.jsonl`,
      records.map((x) => JSON.stringify(x)).join("\n"),
    );
  }
}

const today = new Date();
const yesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

const seedNumbers = [2417094147, 1442802025, 3132289790, 1533516648] as const;
seed(seedNumbers.join("-"));

main(seedNumbers, {
  agents: 50,
  projects: 30,
  organizations: 20,
  users: 200,
  records_per_day: 200000,
  start_date: yesterday,
  end_date: today,
}).catch((err) => {
  console.error("Failed to generate logs:", err);
});
