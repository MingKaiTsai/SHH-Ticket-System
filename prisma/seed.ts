import { PrismaClient, TicketStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { username: "applicant", name: "申請人-護理", role: UserRole.APPLICANT },
  { username: "applicant-int", name: "申請人-內科", role: UserRole.APPLICANT },
  { username: "media-a", name: "多媒體組員A", role: UserRole.MEDIA },
  { username: "media-b", name: "多媒體組員B", role: UserRole.MEDIA },
  { username: "media-c", name: "多媒體組員C", role: UserRole.MEDIA },
  { username: "lead", name: "多媒體組長", role: UserRole.LEAD },
  { username: "approver", name: "審核主管-護理", role: UserRole.APPROVER },
  { username: "approver-int", name: "審核主管-內科", role: UserRole.APPROVER }
];

const tickets = [
  {
    code: "E170-2025-0185",
    unit: "護理部",
    applicantName: "林小姐",
    roleType: "護理",
    ext: "2211",
    purpose: "校院活動",
    category: "海報輸出",
    status: TicketStatus.PENDING
    ,
    assignedToName: null
  },
  {
    code: "E170-2025-0184",
    unit: "內科",
    applicantName: "陳醫師",
    roleType: "內科",
    ext: "4501",
    purpose: "醫學發表",
    category: "海報輸出",
    status: TicketStatus.PENDING
    ,
    assignedToName: null
  },
  {
    code: "E170-2025-0183",
    unit: "內科",
    applicantName: "周醫師",
    roleType: "內科",
    ext: "4503",
    purpose: "教學研究",
    category: "平面設計",
    status: TicketStatus.PENDING
    ,
    assignedToName: null
  },
  {
    code: "E170-2025-0182",
    unit: "護理部",
    applicantName: "王小姐",
    roleType: "護理",
    ext: "2216",
    purpose: "校院活動",
    category: "數位攝影",
    status: TicketStatus.IN_PROGRESS
    ,
    assignedToName: "設計師 蔡OO"
  },
  {
    code: "E170-2025-0181",
    unit: "內科",
    applicantName: "李醫師",
    roleType: "內科",
    ext: "4505",
    purpose: "校院活動",
    category: "數位攝影",
    status: TicketStatus.PENDING
    ,
    assignedToName: null
  },
  {
    code: "E170-2025-0180",
    unit: "護理部",
    applicantName: "徐小姐",
    roleType: "護理",
    ext: "2218",
    purpose: "衛教宣導",
    category: "平面設計",
    status: TicketStatus.PENDING
    ,
    assignedToName: null
  },
  {
    code: "E170-2025-0179",
    unit: "內科",
    applicantName: "張醫師",
    roleType: "內科",
    ext: "4507",
    purpose: "醫學發表",
    category: "海報輸出",
    status: TicketStatus.IN_PROGRESS
    ,
    assignedToName: "設計師 蔡OO"
  },
  {
    code: "E170-2025-0178",
    unit: "護理部",
    applicantName: "林小姐",
    roleType: "護理",
    ext: "2211",
    purpose: "校院活動",
    category: "海報輸出",
    status: TicketStatus.IN_PROGRESS
    ,
    assignedToName: "設計師 李OO"
  },
  {
    code: "E170-2025-0177",
    unit: "內科",
    applicantName: "陳醫師",
    roleType: "內科",
    ext: "4503",
    purpose: "教學研究",
    category: "平面設計",
    status: TicketStatus.WAITING_REPLY
    ,
    assignedToName: "設計師 蔡OO"
  },
  {
    code: "E170-2025-0176",
    unit: "護理部",
    applicantName: "王小姐",
    roleType: "護理",
    ext: "2216",
    purpose: "衛教宣導",
    category: "數位攝影",
    status: TicketStatus.WAITING_REPLY
    ,
    assignedToName: "設計師 黃OO"
  }
];

const completedTickets = Array.from({ length: 30 }, (_, index) => {
  const number = 1669 - index;
  const code = `E170-2025-${String(number).padStart(4, "0")}`;
  return {
    code,
    unit: index % 2 === 0 ? "護理部" : "內科",
    applicantName: index % 2 === 0 ? "林小姐" : "陳醫師",
    roleType: index % 2 === 0 ? "護理" : "內科",
    ext: index % 2 === 0 ? "2211" : "4501",
    purpose: index % 2 === 0 ? "校院活動" : "醫學發表",
    category: index % 2 === 0 ? "海報輸出" : "平面設計",
    status: TicketStatus.DONE,
    assignedToName: index % 2 === 0 ? "設計師 蔡OO" : "設計師 李OO"
  };
});

async function main() {
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.create({
        data: {
          ...user
        }
      })
    )
  );

  const applicant = createdUsers.find((user) => user.role === UserRole.APPLICANT);
  const lead = createdUsers.find((user) => user.role === UserRole.LEAD);

  if (!applicant) {
    throw new Error("Applicant user missing");
  }

  const allTickets = [...tickets, ...completedTickets];

  for (const ticket of allTickets) {
    await prisma.ticket.create({
      data: {
        ...ticket,
        applicantId: applicant.id,
        assignedToId: ticket.status === TicketStatus.IN_PROGRESS ? lead?.id : null,
        statusHistory: {
          create: {
            from: TicketStatus.PENDING,
            to: ticket.status
          }
        }
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
