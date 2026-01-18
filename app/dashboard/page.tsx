"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { demoTickets } from "@/lib/demo-data";

type Ticket = {
  id: string;
  code: string;
  unit: string;
  applicantName: string;
  roleType: string;
  ext: string;
  purpose: string;
  category: string;
  description?: string;
  posterSize?: string;
  posterCustomSize?: string;
  flatSize?: string;
  status: string;
  assignedToName?: string | null;
  applicantId?: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "待處理",
  IN_PROGRESS: "進行中",
  PROOFING: "校稿中",
  WAITING_REPLY: "待回覆",
  DONE: "已完成",
};

const statusOptions = [
  { value: "ALL", label: "全部" },
  { value: "PENDING", label: "待處理" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "PROOFING", label: "校稿中" },
  { value: "WAITING_REPLY", label: "待回覆" },
  { value: "DONE", label: "已完成" },
];

const headers = [
  { key: "code", label: "案件編號" },
  { key: "unit", label: "申請單位" },
  { key: "applicantName", label: "申請人" },
  { key: "roleType", label: "職類" },
  { key: "ext", label: "分機" },
  { key: "purpose", label: "主要用途" },
  { key: "category", label: "申請類別" },
  { key: "sizeDisplay", label: "成品尺寸" },
  { key: "status", label: "狀態" },
  { key: "assignedToName", label: "指派設計師" },
];

const roleMap: Record<string, string> = {
  applicant: "申請人-護理",
  "applicant-int": "申請人-內科",
  "media-a": "多媒體組員A",
  "media-b": "多媒體組員B",
  "media-c": "多媒體組員C",
  lead: "多媒體組長",
  approver: "審核主管-護理",
  "approver-int": "審核主管-內科",
};

const roleUnitMap: Record<string, string> = {
  applicant: "護理部",
  "applicant-int": "內科",
  approver: "護理部",
  "approver-int": "內科",
};

const roleAssigneeMap: Record<string, string> = {
  "media-a": "設計師 蔡OO",
  "media-b": "設計師 李OO",
  "media-c": "設計師 黃OO",
};

const unitRoleTypeMap: Record<string, string> = {
  護理部: "護理",
  內科: "內科",
};

const unitApplicantsMap: Record<string, string[]> = {
  護理部: ["林小姐", "王小姐", "徐小姐"],
  內科: ["陳醫師", "張醫師", "李醫師"],
};

export default function DashboardPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [role, setRole] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [assigneeDrafts, setAssigneeDrafts] = useState<Record<string, string>>(
    {}
  );
  const [updatedFlags, setUpdatedFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [busyItems, setBusyItems] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isNewTicketBusy, setIsNewTicketBusy] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [isActiveExpanded, setIsActiveExpanded] = useState(false);
  const [isReturnExpanded, setIsReturnExpanded] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
  });
  const confirmActionRef = useRef<null | (() => void)>(null);
  const [isApproverPendingExpanded, setIsApproverPendingExpanded] =
    useState(false);
  const [isApproverActiveExpanded, setIsApproverActiveExpanded] =
    useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    unit: "",
    applicantName: "",
    roleType: "",
    ext: "",
    purpose: "",
    category: "",
    posterSize: "",
    posterCustomSize: "",
    flatSize: "",
    description: "",
    status: "PENDING",
    assignedToName: "",
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("demoRole");
    if (!storedRole || !roleMap[storedRole]) {
      router.replace("/login");
      return;
    }
    setRole(storedRole);
    setIsLoading(true);
    const stored = localStorage.getItem("reqsysTickets");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Ticket[];
        setTickets(parsed);
      } catch {
        setTickets(demoTickets as Ticket[]);
        localStorage.setItem("reqsysTickets", JSON.stringify(demoTickets));
      }
    } else {
      setTickets(demoTickets as Ticket[]);
      localStorage.setItem("reqsysTickets", JSON.stringify(demoTickets));
    }
    setIsHydrated(true);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem("reqsysTickets", JSON.stringify(tickets));
  }, [tickets, isHydrated]);

  const approverUnitTickets = useMemo(() => {
    if (role === "approver" || role === "approver-int") {
      const unit = roleUnitMap[role];
      return tickets.filter((ticket) => ticket.unit === unit);
    }
    return [];
  }, [tickets, role]);

  const applicantReturnTickets = useMemo(() => {
    if (role === "applicant" || role === "applicant-int") {
      const unit = roleUnitMap[role];
      return tickets.filter(
        (ticket) =>
          ticket.unit === unit &&
          (ticket.status === "WAITING_REPLY" || ticket.status === "PENDING")
      );
    }
    return [];
  }, [tickets, role]);

  const applicantActiveTickets = useMemo(() => {
    if (role === "applicant" || role === "applicant-int") {
      const unit = roleUnitMap[role];
      return tickets.filter(
        (ticket) =>
          ticket.unit === unit &&
          ["IN_PROGRESS", "PROOFING"].includes(ticket.status)
      );
    }
    return [];
  }, [tickets, role]);

  const approverActiveTickets = useMemo(() => {
    if (role === "approver" || role === "approver-int") {
      return approverUnitTickets.filter((ticket) =>
        ["IN_PROGRESS", "PROOFING", "WAITING_REPLY"].includes(ticket.status)
      );
    }
    return [];
  }, [approverUnitTickets, role]);


  const scopedTickets = useMemo(() => {
    if (role === "applicant" || role === "applicant-int") {
      const unit = roleUnitMap[role];
      return tickets.filter((ticket) => ticket.unit === unit);
    }
    if (role === "approver" || role === "approver-int") {
      return approverUnitTickets.filter((ticket) => ticket.status === "PENDING");
    }
    if (roleAssigneeMap[role]) {
      const assignee = roleAssigneeMap[role];
      return tickets.filter(
        (ticket) =>
          ticket.assignedToName === assignee && ticket.status !== "DONE"
      );
    }
    return tickets;
  }, [tickets, role]);

  const leadAssignTickets = useMemo(() => {
    if (role !== "lead") {
      return [];
    }
    return tickets.filter(
      (ticket) =>
        ticket.status === "PENDING" ||
        (ticket.status === "IN_PROGRESS" && !ticket.assignedToName)
    );
  }, [tickets, role]);

  const leadInProgressTickets = useMemo(() => {
    if (role !== "lead") {
      return [];
    }
    return tickets.filter(
      (ticket) =>
        ["IN_PROGRESS", "PROOFING", "WAITING_REPLY"].includes(ticket.status) &&
        Boolean(ticket.assignedToName)
    );
  }, [tickets, role]);

  const filteredTickets = useMemo(() => {
    return scopedTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;
      const searchText = Object.values(ticket)
        .join(" ")
        .toLowerCase();
      const matchesKeyword =
        keyword.trim() === "" || searchText.includes(keyword.toLowerCase());
      return matchesStatus && matchesKeyword;
    });
  }, [scopedTickets, statusFilter, keyword]);

  const listBaseTickets =
    role === "approver" || role === "approver-int"
      ? approverUnitTickets
      : role === "applicant" || role === "applicant-int"
        ? scopedTickets
        : tickets;

  const allFilteredTickets = useMemo(() => {
    return listBaseTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;
      const searchText = Object.values(ticket)
        .join(" ")
        .toLowerCase();
      const matchesKeyword =
        keyword.trim() === "" || searchText.includes(keyword.toLowerCase());
      return matchesStatus && matchesKeyword;
    });
  }, [listBaseTickets, statusFilter, keyword]);

  const sortedTickets = useMemo(() => {
    const list = [...filteredTickets];
    list.sort((a, b) => {
      const aValue =
        sortKey === "sizeDisplay"
          ? getSizeLabel(a)
          : String(a[sortKey as keyof Ticket] ?? "");
      const bValue =
        sortKey === "sizeDisplay"
          ? getSizeLabel(b)
          : String(b[sortKey as keyof Ticket] ?? "");
      const direction = sortDirection === "asc" ? 1 : -1;
      return aValue.localeCompare(bValue, "zh-Hant") * direction;
    });
    return list;
  }, [filteredTickets, sortKey, sortDirection]);

  const allSortedTickets = useMemo(() => {
    const list = [...allFilteredTickets];
    list.sort((a, b) => {
      const aValue =
        sortKey === "sizeDisplay"
          ? getSizeLabel(a)
          : String(a[sortKey as keyof Ticket] ?? "");
      const bValue =
        sortKey === "sizeDisplay"
          ? getSizeLabel(b)
          : String(b[sortKey as keyof Ticket] ?? "");
      const direction = sortDirection === "asc" ? 1 : -1;
      return aValue.localeCompare(bValue, "zh-Hant") * direction;
    });
    return list;
  }, [allFilteredTickets, sortKey, sortDirection]);

  const counts = useMemo(() => {
    const countSource =
      role === "approver" || role === "approver-int"
        ? approverUnitTickets
        : role === "applicant" || role === "applicant-int"
          ? scopedTickets
          : tickets;
    const pending = countSource.filter((t) => t.status === "PENDING").length;
    const inProgress = countSource.filter((t) =>
      ["IN_PROGRESS", "PROOFING"].includes(t.status)
    ).length;
    const done = countSource.filter((t) => t.status === "DONE").length;
    const waiting = countSource.filter(
      (t) => t.status === "WAITING_REPLY"
    ).length;
    return {
      all: countSource.length,
      pending,
      inProgress,
      done,
      waiting,
    };
  }, [approverUnitTickets, role, tickets]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("demoRole");
    localStorage.removeItem("demoUser");
    router.replace("/login");
  };

  const handleRoleChange = (nextRole: string) => {
    setRole(nextRole);
    localStorage.setItem("demoRole", nextRole);
  };

  const openNewTicketModal = () => {
    const unit = roleUnitMap[role] ?? "";
    const applicantName = "";
    const roleType = unitRoleTypeMap[unit] ?? "";
    setNewTicketForm({
      unit,
      applicantName,
      roleType,
      ext: "",
      purpose: "",
      category: "",
      posterSize: "",
      posterCustomSize: "",
      flatSize: "",
      description: "",
      status: "PENDING",
      assignedToName: "",
    });
    setEditingTicketId(null);
    setIsNewTicketOpen(true);
  };

  const openEditTicketModal = (ticket: Ticket) => {
    setNewTicketForm({
      unit: ticket.unit,
      applicantName: ticket.applicantName,
      roleType: unitRoleTypeMap[ticket.unit] ?? ticket.roleType,
      ext: ticket.ext,
      purpose: ticket.purpose,
      category: ticket.category,
      posterSize: ticket.posterSize ?? "",
      posterCustomSize: ticket.posterCustomSize ?? "",
      flatSize: ticket.flatSize ?? "",
      description: "需求更新：請補充必要資訊後重新送出。",
      status: ticket.status ?? "PENDING",
      assignedToName: ticket.assignedToName ?? "",
    });
    setEditingTicketId(ticket.id);
    setIsNewTicketOpen(true);
  };

  const handleNewTicketChange = (
    field: keyof typeof newTicketForm,
    value: string
  ) => {
    setNewTicketForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoFill = () => {
    const applicants = unitApplicantsMap[newTicketForm.unit] ?? [];
    setNewTicketForm((prev) => ({
      ...prev,
      applicantName: applicants[0] ?? prev.applicantName,
      roleType: unitRoleTypeMap[newTicketForm.unit] ?? prev.roleType,
      ext: prev.ext || (newTicketForm.unit === "護理部" ? "2211" : "4501"),
      purpose: prev.purpose || "校院活動",
      category: prev.category || "海報輸出",
      posterSize: prev.posterSize || "A1",
      flatSize: prev.flatSize,
      description:
        prev.description ||
        "A1海報三張，本週五衛教活動宣傳使用。",
    }));
  };

  const applicantOptions = useMemo(() => {
    if (!newTicketForm.unit) {
      return [];
    }
    return unitApplicantsMap[newTicketForm.unit] ?? [];
  }, [newTicketForm.unit]);

  const handleNewTicketSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isNewTicketBusy) {
      return;
    }
    openConfirm(
      editingTicketId ? "確認送出修改並重新送審？" : "確認送出申請？",
      () => {
        setIsNewTicketBusy(true);
        const editingTicket = editingTicketId
          ? tickets.find((ticket) => ticket.id === editingTicketId)
          : null;
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        const code = `E170-2025-${codeSuffix}`;
        const localTicket: Ticket = {
          id: editingTicketId ?? `local-${Date.now()}`,
          code: editingTicket?.code ?? code,
          unit: newTicketForm.unit,
          applicantName: newTicketForm.applicantName,
          roleType: newTicketForm.roleType,
          ext: newTicketForm.ext,
          purpose: newTicketForm.purpose,
          category: newTicketForm.category,
          description: newTicketForm.description || undefined,
          posterSize: newTicketForm.posterSize || undefined,
          posterCustomSize: newTicketForm.posterCustomSize || undefined,
          flatSize: newTicketForm.flatSize || undefined,
          status:
            role === "lead" && editingTicketId
              ? newTicketForm.status || "PENDING"
              : editingTicket?.status ?? "PENDING",
          assignedToName:
            role === "lead" && editingTicketId
              ? newTicketForm.assignedToName || null
              : editingTicket?.assignedToName ?? null,
        };

        setTickets((prev) => {
          if (editingTicketId) {
            return prev.map((ticket) =>
              ticket.id === editingTicketId ? localTicket : ticket
            );
          }
          return [localTicket, ...prev];
        });
        setToastMessage(
          editingTicketId
            ? "修改已確認，請再送出審核"
            : "申請已送出，請盡快請主管審核"
        );
        setIsNewTicketOpen(false);
        setIsNewTicketBusy(false);
        setEditingTicketId(null);
      }
    );
  };

  const handleStatusDraft = (ticketId: string, nextStatus: string) => {
    setStatusDrafts((prev) => ({ ...prev, [ticketId]: nextStatus }));
    setUpdatedFlags((prev) => ({ ...prev, [ticketId]: false }));
  };

  const handleAssigneeDraft = (ticketId: string, nextAssignee: string) => {
    setAssigneeDrafts((prev) => ({ ...prev, [ticketId]: nextAssignee }));
    setUpdatedFlags((prev) => ({ ...prev, [ticketId]: false }));
  };

  const handleApplyChanges = (ticketId: string) => {
    const target = tickets.find((ticket) => ticket.id === ticketId);
    if (!target) {
      setBusyItems((prev) => ({ ...prev, [ticketId]: false }));
      return;
    }
    const nextStatus = statusDrafts[ticketId] ?? target.status;
    const nextAssignee =
      assigneeDrafts[ticketId] ?? target.assignedToName ?? null;
    const hasChanges =
      nextStatus !== target.status ||
      nextAssignee !== (target.assignedToName ?? null);

    if (!hasChanges) {
      setUpdatedFlags((prev) => ({ ...prev, [ticketId]: true }));
      setBusyItems((prev) => ({ ...prev, [ticketId]: false }));
      return;
    }

    const updated: Ticket = {
      ...target,
      status: nextStatus,
      assignedToName: nextAssignee,
    };
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === ticketId ? updated : ticket))
    );
    setStatusDrafts((prev) => {
      const { [ticketId]: _, ...rest } = prev;
      return rest;
    });
    setAssigneeDrafts((prev) => {
      const { [ticketId]: _, ...rest } = prev;
      return rest;
    });
    setUpdatedFlags((prev) => ({ ...prev, [ticketId]: true }));
    setToastMessage("案件已更新");
    setBusyItems((prev) => ({ ...prev, [ticketId]: false }));
  };

  const handleApproval = (ticketId: string, nextStatus: string) => {
    setBusyItems((prev) => ({ ...prev, [ticketId]: true }));
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket
      )
    );
    setToastMessage(
      nextStatus === "IN_PROGRESS"
        ? "案件已核准，將由多媒體組派工"
        : "案件已退回，請申請人補件"
    );
    setBusyItems((prev) => ({ ...prev, [ticketId]: false }));
  };

  const handleApprovalConfirm = (ticketId: string, nextStatus: string) => {
    const message =
      nextStatus === "IN_PROGRESS" ? "確認核准這筆案件？" : "確認退回這筆案件？";
    openConfirm(message, () => handleApproval(ticketId, nextStatus));
  };

  const handleApplicantResubmit = (ticketId: string) => {
    openConfirm("確認送出審核？", () => {
      setBusyItems((prev) => ({ ...prev, [ticketId]: true }));
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: "PENDING", assignedToName: null }
            : ticket
        )
      );
      setToastMessage("申請已送出，請盡快請主管審核");
      setBusyItems((prev) => ({ ...prev, [ticketId]: false }));
    });
  };

  const getAssigneeLabel = (ticket: Ticket) => {
    if (ticket.status === "PENDING") {
      return "";
    }
    return ticket.assignedToName || "未指派";
  };

  const getSizeLabel = (ticket: Ticket) => {
    if (ticket.category === "海報輸出") {
      return ticket.posterCustomSize || ticket.posterSize || "未填";
    }
    if (ticket.category === "平面設計") {
      return ticket.flatSize || "未填";
    }
    return "未填";
  };

  const DESCRIPTION_LIMIT = 120;

  const renderDescription = (ticket: Ticket) => {
    const text = ticket.description?.trim() ?? "";
    const isExpanded = Boolean(expandedDescriptions[ticket.id]);
    const isTruncated = text.length > DESCRIPTION_LIMIT;
    const preview =
      !text
        ? "未填"
        : isExpanded || !isTruncated
        ? text
        : `${text.slice(0, DESCRIPTION_LIMIT)}…`;

    return (
      <div className="detail-note">
        <p className="detail-label">內容說明</p>
        <p className="detail-value">{preview}</p>
        {isTruncated ? (
          <button
            className="text-link"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExpandedDescriptions((prev) => ({
                ...prev,
                [ticket.id]: !prev[ticket.id],
              }));
            }}
          >
            {isExpanded ? "收合內容" : "顯示完整內容"}
          </button>
        ) : null}
      </div>
    );
  };

  const openConfirm = (
    message: string,
    onConfirm: () => void,
    title = "請確認"
  ) => {
    confirmActionRef.current = onConfirm;
    setConfirmModal({ open: true, title, message });
  };

  const closeConfirm = () => {
    confirmActionRef.current = null;
    setConfirmModal({ open: false, title: "", message: "" });
  };

  const handleConfirm = () => {
    const action = confirmActionRef.current;
    closeConfirm();
    if (action) {
      action();
    }
  };

  const renderMediaCaseList = (list: Ticket[], limit = 6) => (
    <div className="case-list capped-list">
      {list.slice(0, limit).map((ticket) => {
        const draftStatus = statusDrafts[ticket.id] ?? ticket.status;
        const draftAssignee =
          assigneeDrafts[ticket.id] ?? ticket.assignedToName ?? "";
        const hasChanges =
          draftStatus !== ticket.status ||
          draftAssignee !== (ticket.assignedToName ?? "");
        const updated = updatedFlags[ticket.id];
        const isPendingApproval = ticket.status === "PENDING";
        const isBusy = busyItems[ticket.id];

        return (
          <details
            key={ticket.id}
            className="case-item"
            data-status={statusLabels[ticket.status] || ticket.status}
          >
            <summary className="case-summary">
              <div>
                <p className="item-title">
                  {ticket.code}｜{ticket.category}
                </p>
                <p className="item-note">
                  {ticket.unit}｜{ticket.purpose}
                </p>
              </div>
              {role === "lead" ? (
                <>
                  <div className="assign-control">
                    <select
                      className="assign-select"
                      value={draftAssignee}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        handleAssigneeDraft(ticket.id, event.target.value)
                      }
                      disabled={isPendingApproval || isBusy}
                      title={isPendingApproval ? "待審核不能指派" : ""}
                    >
                      <option value="">未指派</option>
                      <option value="設計師 蔡OO">設計師 蔡OO</option>
                      <option value="設計師 李OO">設計師 李OO</option>
                      <option value="設計師 黃OO">設計師 黃OO</option>
                    </select>
                  </div>
                  <button
                    className="status-confirm"
                    type="button"
                    disabled={isPendingApproval || isBusy}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleApplyWithBusy(ticket.id);
                    }}
                    title={isPendingApproval ? "待審核不能指派" : ""}
                  >
                    {isBusy ? (
                      <>
                        <span className="inline-spinner" />
                        更新中
                      </>
                    ) : updated ? (
                      "已更新"
                    ) : (
                      "確認"
                    )}
                  </button>
                  {isPendingApproval ? (
                    <span className="status-badge">待審核</span>
                  ) : null}
                </>
              ) : role === "media-a" ||
                role === "media-b" ||
                role === "media-c" ? (
                <div className="status-control">
                  <select
                    className="status-select"
                    value={draftStatus}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      handleStatusDraft(ticket.id, event.target.value)
                    }
                    disabled={isPendingApproval || isBusy}
                    title={isPendingApproval ? "待審核不能指派" : ""}
                  >
                    <option value="PENDING">待確認</option>
                    <option value="IN_PROGRESS">製作中</option>
                    <option value="PROOFING">校稿中</option>
                    <option value="WAITING_REPLY">待回覆</option>
                    <option value="DONE">已完成</option>
                  </select>
                  <button
                    className="status-confirm"
                    type="button"
                    disabled={isPendingApproval || isBusy}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleApplyWithBusy(ticket.id);
                    }}
                    title={isPendingApproval ? "待審核不能指派" : ""}
                  >
                    {isBusy ? (
                      <>
                        <span className="inline-spinner" />
                        更新中
                      </>
                    ) : updated ? (
                      "已更新"
                    ) : (
                      "確認"
                    )}
                  </button>
                </div>
              ) : (
                <span className="status-badge">
                  {statusLabels[ticket.status] || ticket.status}
                </span>
              )}
              {role === "lead" ? null : (
                <span className="assign-badge">{getAssigneeLabel(ticket)}</span>
              )}
            </summary>
            <div className="case-detail">
              <div className="detail-grid">
                <div>
                  <p className="detail-label">申請單位</p>
                  <p className="detail-value">{ticket.unit}</p>
                </div>
                <div>
                  <p className="detail-label">申請人</p>
                  <p className="detail-value">{ticket.applicantName}</p>
                </div>
                <div>
                  <p className="detail-label">職類</p>
                  <p className="detail-value">{ticket.roleType}</p>
                </div>
                <div>
                  <p className="detail-label">分機</p>
                  <p className="detail-value">{ticket.ext}</p>
                </div>
                <div>
                  <p className="detail-label">指派設計師</p>
                  <p className="detail-value">{getAssigneeLabel(ticket)}</p>
                </div>
              </div>
              <div className="detail-grid">
                <div>
                  <p className="detail-label">主要用途</p>
                  <p className="detail-value">{ticket.purpose}</p>
                </div>
                <div>
                  <p className="detail-label">申請類別</p>
                  <p className="detail-value">{ticket.category}</p>
                </div>
                {(ticket.category === "海報輸出" ||
                  ticket.category === "平面設計") && (
                  <div>
                    <p className="detail-label">成品尺寸</p>
                    <p className="detail-value">{getSizeLabel(ticket)}</p>
                  </div>
                )}
              </div>
              {renderDescription(ticket)}
            </div>
          </details>
        );
      })}
    </div>
  );

  const handleApplyWithBusy = (ticketId: string) => {
    openConfirm("確認更新狀態與指派？", () => {
      setBusyItems((prev) => ({ ...prev, [ticketId]: true }));
      handleApplyChanges(ticketId);
    });
  };

  const handleDeleteTicket = (ticketId: string) => {
    openConfirm("確定要刪除這筆案件嗎？", () => {
      setBusyItems((prev) => ({ ...prev, [ticketId]: true }));
      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
      setSelectedTicket(null);
      setToastMessage("案件已刪除");
      setBusyItems((prev) => ({ ...prev, [ticketId]: false }));
    });
  };

  const handleExportCsv = () => {
    const headersRow = headers.map((header) => header.label);
    const rows = allSortedTickets.map((ticket) => [
      ticket.code,
      ticket.unit,
      ticket.applicantName,
      ticket.roleType,
      ticket.ext,
      ticket.purpose,
      ticket.category,
      getSizeLabel(ticket),
      statusLabels[ticket.status] || ticket.status,
      getAssigneeLabel(ticket),
    ]);
    const csvRows = [
      headersRow,
      ...rows,
    ].map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reqsys-tickets.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderCaseListSection = (extraClass?: string) => (
    <section className={`panel${extraClass ? ` ${extraClass}` : ""}`}>
      <div className="panel-head">
        <h3>案件清單</h3>
        <span className="panel-note">
          {isLoading ? (
            <>
              <span className="inline-spinner" aria-hidden="true" />
              讀取中
            </>
          ) : (
            "可搜尋、篩選、排序"
          )}
        </span>
      </div>
      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="搜尋案件編號或單位"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>
      <div className="table-area">
        {isLoading ? (
          <div className="table-loading" aria-live="polite">
            <span className="inline-spinner" aria-hidden="true" />
            讀取中
          </div>
        ) : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header.key} onClick={() => handleSort(header.key)}>
                    {header.label}{" "}
                    <span className="sort-indicator">
                      {sortKey === header.key
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : "?"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSortedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="table-row"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td>{ticket.code}</td>
                  <td>{ticket.unit}</td>
                  <td>{ticket.applicantName}</td>
                  <td>{ticket.roleType}</td>
                  <td>{ticket.ext}</td>
                  <td>{ticket.purpose}</td>
                  <td>{ticket.category}</td>
                  <td>{getSizeLabel(ticket)}</td>
                  <td>{statusLabels[ticket.status] || ticket.status}</td>
                  <td>{getAssigneeLabel(ticket)}</td>
                </tr>
              ))}
              {allSortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={10}>無符合條件的案件</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  return (
    <div className="page">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-mark" />
            <div className="brand-text">
              <p className="brand-eyebrow">E170 REQUEST SYSTEM</p>
              <h1>工單系統 Dashboard</h1>
            </div>
          </div>
          <div className="header-actions">
            <label className="role-switch">
              <span>Demo用角色切換</span>
              <select
                value={role}
                onChange={(event) => handleRoleChange(event.target.value)}
              >
                {Object.entries(roleMap).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="ghost-btn" type="button" onClick={handleLogout}>
              登出
            </button>
            {role === "applicant" || role === "applicant-int" ? (
              <button
                className="primary-btn"
                type="button"
                onClick={openNewTicketModal}
              >
                新增申請
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container dashboard">
        {confirmModal.open ? (
          <div className="confirm-overlay" onClick={closeConfirm}>
            <div
              className="confirm-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <h4>{confirmModal.title}</h4>
              <p>{confirmModal.message}</p>
              <div className="confirm-actions">
                <button className="ghost-btn" type="button" onClick={closeConfirm}>
                  取消
                </button>
                <button className="primary-btn" type="button" onClick={handleConfirm}>
                  確認
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {toastMessage ? (
          <div
            className="confirm-overlay"
            role="status"
            aria-live="polite"
            onClick={() => setToastMessage("")}
          >
            <div
              className="confirm-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <p>{toastMessage}</p>
              <button
                className="primary-btn"
                type="button"
                onClick={() => setToastMessage("")}
              >
                確認
              </button>
            </div>
          </div>
        ) : null}
        {selectedTicket ? (
          <div
            className="detail-overlay"
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="detail-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="detail-modal-head">
                <h4>案件細節</h4>
                <div className="detail-modal-actions">
                  {role === "lead" ? (
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => {
                        openEditTicketModal(selectedTicket);
                        setSelectedTicket(null);
                      }}
                    >
                      編輯案件
                    </button>
                  ) : null}
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                  >
                    關閉
                  </button>
                </div>
              </div>
              <div className="detail-modal-grid">
                <div>
                  <p className="detail-label">案件編號</p>
                  <p className="detail-value">{selectedTicket.code}</p>
                </div>
                <div>
                  <p className="detail-label">申請單位</p>
                  <p className="detail-value">{selectedTicket.unit}</p>
                </div>
                <div>
                  <p className="detail-label">申請人</p>
                  <p className="detail-value">{selectedTicket.applicantName}</p>
                </div>
                <div>
                  <p className="detail-label">職類</p>
                  <p className="detail-value">{selectedTicket.roleType}</p>
                </div>
                <div>
                  <p className="detail-label">分機</p>
                  <p className="detail-value">{selectedTicket.ext}</p>
                </div>
                <div>
                  <p className="detail-label">主要用途</p>
                  <p className="detail-value">{selectedTicket.purpose}</p>
                </div>
                <div>
                  <p className="detail-label">申請類別</p>
                  <p className="detail-value">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="detail-label">成品尺寸</p>
                  <p className="detail-value">{getSizeLabel(selectedTicket)}</p>
                </div>
                <div>
                  <p className="detail-label">狀態</p>
                  <p className="detail-value">
                    {statusLabels[selectedTicket.status] ||
                      selectedTicket.status}
                  </p>
                </div>
                <div>
                  <p className="detail-label">指派設計師</p>
                  <p className="detail-value">
                    {getAssigneeLabel(selectedTicket) || "未指派"}
                  </p>
                </div>
              </div>
              {renderDescription(selectedTicket)}
            </div>
          </div>
        ) : null}
        {isNewTicketOpen ? (
          <div
            className="form-overlay"
            onClick={() => setIsNewTicketOpen(false)}
          >
            <div
              className="form-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="detail-modal-head">
                <h4>{editingTicketId ? "修改申請" : "新增申請"}</h4>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                >
                  關閉
                </button>
              </div>
              <form className="form-grid" onSubmit={handleNewTicketSubmit}>
                <div className="form-grid two-col">
                  <label>
                    <span>申請單位</span>
                    <input
                      type="text"
                      value={newTicketForm.unit}
                      disabled
                      className="field-locked"
                      required
                    />
                  </label>
                  <label>
                    <span>申請人</span>
                    <select
                      value={newTicketForm.applicantName}
                      onChange={(event) =>
                        handleNewTicketChange(
                          "applicantName",
                          event.target.value
                        )
                      }
                      required
                    >
                      <option value="">請選擇</option>
                      {applicantOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>職類</span>
                    <input
                      type="text"
                      value={newTicketForm.roleType}
                      disabled
                      className="field-locked"
                      required
                    />
                  </label>
                  <label>
                    <span>分機</span>
                    <input
                      type="text"
                      placeholder="輸入分機"
                      value={newTicketForm.ext}
                      onChange={(event) =>
                        handleNewTicketChange("ext", event.target.value)
                      }
                      required
                    />
                  </label>
                </div>
                <label>
                  <span>主要用途</span>
                  <select
                    value={newTicketForm.purpose}
                    onChange={(event) =>
                      handleNewTicketChange("purpose", event.target.value)
                    }
                    required
                  >
                    <option value="">請選擇</option>
                    <option value="教學研究">教學研究</option>
                    <option value="醫學發表">醫學發表</option>
                    <option value="衛教宣導">衛教宣導</option>
                    <option value="單位行銷">單位行銷</option>
                    <option value="行政公告">行政公告</option>
                    <option value="空間標示">空間標示</option>
                    <option value="校院活動">校院活動</option>
                    <option value="外部競賽">外部競賽</option>
                    <option value="品牌行銷">品牌行銷</option>
                  </select>
                </label>
                <label>
                  <span>申請類別</span>
                  <select
                    value={newTicketForm.category}
                    onChange={(event) =>
                      handleNewTicketChange("category", event.target.value)
                    }
                    required
                  >
                    <option value="">請選擇</option>
                    <option value="海報輸出">海報輸出</option>
                    <option value="影片製作">影片製作</option>
                    <option value="數位攝影">數位攝影</option>
                    <option value="平面設計">平面設計</option>
                  </select>
                </label>
                {newTicketForm.category === "海報輸出" ? (
                  <div className="form-grid two-col">
                    <label>
                      <span>海報尺寸</span>
                      <select
                        value={newTicketForm.posterSize}
                        onChange={(event) =>
                          handleNewTicketChange(
                            "posterSize",
                            event.target.value
                          )
                        }
                      >
                        <option value="">請選擇</option>
                        <option value="A0">A0</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                      </select>
                    </label>
                    <label>
                      <span>自訂尺寸</span>
                      <input
                        type="text"
                        placeholder="例如 90x120cm"
                        value={newTicketForm.posterCustomSize}
                        onChange={(event) =>
                          handleNewTicketChange(
                            "posterCustomSize",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>
                ) : null}
                {newTicketForm.category === "平面設計" ? (
                  <label>
                    <span>成品尺寸</span>
                    <input
                      type="text"
                      placeholder="例如 名片小卡、A1 海報、A4 書刊封面"
                      value={newTicketForm.flatSize}
                      onChange={(event) =>
                        handleNewTicketChange("flatSize", event.target.value)
                      }
                    />
                  </label>
                ) : null}
                {role === "lead" && editingTicketId ? (
                  <div className="form-grid two-col">
                    <label>
                      <span>狀態</span>
                      <select
                        value={newTicketForm.status}
                        onChange={(event) =>
                          handleNewTicketChange("status", event.target.value)
                        }
                      >
                        <option value="PENDING">待確認</option>
                        <option value="IN_PROGRESS">製作中</option>
                        <option value="PROOFING">校稿中</option>
                        <option value="WAITING_REPLY">待回覆</option>
                        <option value="DONE">已完成</option>
                      </select>
                    </label>
                    <label>
                      <span>指派設計師</span>
                      <select
                        value={newTicketForm.assignedToName}
                        onChange={(event) =>
                          handleNewTicketChange(
                            "assignedToName",
                            event.target.value
                          )
                        }
                      >
                        <option value="">未指派</option>
                        <option value="設計師 蔡OO">設計師 蔡OO</option>
                        <option value="設計師 李OO">設計師 李OO</option>
                        <option value="設計師 黃OO">設計師 黃OO</option>
                      </select>
                    </label>
                  </div>
                ) : null}
                <label className="wide">
                  <span>內容說明</span>
                  <textarea
                    rows={4}
                    placeholder="請描述需求重點"
                    value={newTicketForm.description}
                    onChange={(event) =>
                      handleNewTicketChange("description", event.target.value)
                    }
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={handleAutoFill}
                  >
                    自動填入
                  </button>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setIsNewTicketOpen(false)}
                  >
                    取消
                  </button>
                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={isNewTicketBusy}
                  >
                    {isNewTicketBusy
                      ? "送出中"
                      : editingTicketId
                        ? "確認"
                        : "送出申請"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
        <section className="summary-grid">
          <div className="summary-card">
            <p className="summary-title">全部案件</p>
            <p className="summary-value">{counts.all}</p>
            <p className="summary-note">清單 {counts.all} 件</p>
          </div>
          <div className="summary-card">
            <p className="summary-title">待處理</p>
            <p className="summary-value">{counts.pending}</p>
            <p className="summary-note">清單 {counts.pending} 件</p>
          </div>
          <div className="summary-card">
            <p className="summary-title">進行中</p>
            <p className="summary-value">{counts.inProgress}</p>
            <p className="summary-note">清單 {counts.inProgress} 件</p>
          </div>
          <div className="summary-card">
            <p className="summary-title">已完成</p>
            <p className="summary-value">{counts.done}</p>
            <p className="summary-note">清單 {counts.done} 件</p>
          </div>
          <div className="summary-card">
            <p className="summary-title">待回覆</p>
            <p className="summary-value">{counts.waiting}</p>
            <p className="summary-note">清單 {counts.waiting} 件</p>
          </div>
        </section>

        {role === "media-a" || role === "media-b" || role === "media-c" ? (
          <section className="panel">
            <div className="panel-head">
              <h3>處理中案件</h3>
              <span className="panel-note">
                {isLoading ? (
                  <>
                    <span className="inline-spinner" aria-hidden="true" />
                    讀取中
                  </>
                ) : (
                  "點擊案件檢視細節"
                )}
              </span>
            </div>
            {renderMediaCaseList(scopedTickets)}
          </section>
        ) : null}

        {role === "lead" ? (
          <div className="applicant-duo">
            <section className="panel">
              <div className="panel-head">
                <h3>待派工</h3>
                <span className="panel-note">待審核與待派工案件</span>
              </div>
              {renderMediaCaseList(leadAssignTickets, leadAssignTickets.length)}
            </section>
            <section className="panel">
              <div className="panel-head">
                <h3>處理中</h3>
                <span className="panel-note">已指派製作中的案件</span>
              </div>
              {renderMediaCaseList(
                leadInProgressTickets,
                leadInProgressTickets.length
              )}
            </section>
          </div>
        ) : null}

        {role === "applicant" || role === "applicant-int" ? (
          <div className="applicant-duo">
            <section className="panel">
              <div className="panel-head">
                <h3>處理中</h3>
                <span className="panel-note">已審核過，多媒體處理中的案件</span>
              </div>
              <div
                className={`case-list capped-list${
                  isActiveExpanded ? " expanded" : ""
                }`}
              >
                {applicantActiveTickets.map((ticket) => (
                  <details key={ticket.id} className="case-item">
                    <summary className="case-summary">
                      <div>
                        <p className="item-title">
                          {ticket.code}｜{ticket.category}
                        </p>
                        <p className="item-note">
                          {ticket.unit}｜{ticket.applicantName}
                        </p>
                      </div>
                      <span className="status-badge">
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                    </summary>
                    <div className="case-detail">
                      <div className="detail-grid">
                        <div>
                          <p className="detail-label">主要用途</p>
                          <p className="detail-value">{ticket.purpose}</p>
                        </div>
                        <div>
                          <p className="detail-label">申請類別</p>
                          <p className="detail-value">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="detail-label">成品尺寸</p>
                          <p className="detail-value">{getSizeLabel(ticket)}</p>
                        </div>
                      </div>
                      {renderDescription(ticket)}
                    </div>
                  </details>
                ))}
                {applicantActiveTickets.length === 0 ? (
                  <div className="empty-state">目前沒有製作中案件</div>
                ) : null}
              </div>
              {applicantActiveTickets.length > 5 ? (
                <button
                  className="ghost-btn mobile-toggle"
                  type="button"
                  onClick={() => setIsActiveExpanded((prev) => !prev)}
                  aria-expanded={isActiveExpanded}
                >
                  {isActiveExpanded ? "收合" : "展開全部"} ▼
                </button>
              ) : null}
            </section>
            <section className="panel">
              <div className="panel-head">
                <h3>待審核</h3>
                <span className="panel-note">待審核案件請補齊後送審</span>
              </div>
              <div
                className={`case-list capped-list${
                  isReturnExpanded ? " expanded" : ""
                }`}
              >
                {applicantReturnTickets.map((ticket) => (
                  <details key={ticket.id} className="case-item">
                    <summary className="case-summary">
                      <div>
                        <p className="item-title">
                          {ticket.code}｜{ticket.category}
                        </p>
                        <p className="item-note">
                          {ticket.unit}｜{ticket.applicantName}
                        </p>
                      </div>
                      {ticket.status === "PENDING" ? (
                        <span className="status-badge">等待審核中</span>
                      ) : (
                        <div className="action-group">
                          <button
                            className="ghost-btn"
                            type="button"
                            disabled={busyItems[ticket.id]}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditTicketModal(ticket);
                            }}
                          >
                            修改
                          </button>
                          <button
                            className="primary-btn"
                            type="button"
                            disabled={busyItems[ticket.id]}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleApplicantResubmit(ticket.id);
                            }}
                          >
                            {busyItems[ticket.id] ? (
                              <>
                                <span className="inline-spinner" />
                                送出中
                              </>
                            ) : (
                              "送出審核"
                            )}
                          </button>
                          <button
                            className="ghost-btn danger-btn"
                            type="button"
                            disabled={busyItems[ticket.id]}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteTicket(ticket.id);
                            }}
                          >
                            刪除
                          </button>
                        </div>
                      )}
                    </summary>
                    <div className="case-detail">
                      <div className="detail-grid">
                        <div>
                          <p className="detail-label">主要用途</p>
                          <p className="detail-value">{ticket.purpose}</p>
                        </div>
                        <div>
                          <p className="detail-label">申請類別</p>
                          <p className="detail-value">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="detail-label">成品尺寸</p>
                          <p className="detail-value">{getSizeLabel(ticket)}</p>
                        </div>
                      </div>
                      {renderDescription(ticket)}
                    </div>
                  </details>
                ))}
                {applicantReturnTickets.length === 0 ? (
                  <div className="empty-state">目前沒有待審核案件</div>
                ) : null}
              </div>
              {applicantReturnTickets.length > 5 ? (
                <button
                  className="ghost-btn mobile-toggle"
                  type="button"
                  onClick={() => setIsReturnExpanded((prev) => !prev)}
                  aria-expanded={isReturnExpanded}
                >
                  {isReturnExpanded ? "收合" : "展開全部"} ▼
                </button>
              ) : null}
            </section>
          </div>
        ) : null}

        {role === "approver" || role === "approver-int" ? (
          <div className="applicant-duo">
            <section className="panel">
              <div className="panel-head">
                <h3>待審核</h3>
                <span className="panel-note">請確認後送出</span>
              </div>
              <div
                className={`case-list capped-list${
                  isApproverPendingExpanded ? " expanded" : ""
                }`}
              >
                {scopedTickets.map((ticket) => (
                  <details key={ticket.id} className="case-item">
                    <summary className="case-summary">
                      <div>
                        <p className="item-title">
                          {ticket.code}｜{ticket.category}
                        </p>
                        <p className="item-note">
                          {ticket.unit}｜{ticket.applicantName}
                        </p>
                      </div>
                      <div className="action-group">
                        <button
                        className="ghost-btn"
                        type="button"
                        disabled={busyItems[ticket.id]}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleApprovalConfirm(ticket.id, "WAITING_REPLY");
                        }}
                      >
                          {busyItems[ticket.id] ? (
                            <>
                              <span className="inline-spinner" />
                              處理中
                            </>
                          ) : (
                            "退回"
                          )}
                        </button>
                        <button
                        className="primary-btn"
                        type="button"
                        disabled={busyItems[ticket.id]}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleApprovalConfirm(ticket.id, "IN_PROGRESS");
                        }}
                      >
                          {busyItems[ticket.id] ? (
                            <>
                              <span className="inline-spinner" />
                              處理中
                            </>
                          ) : (
                            "核准"
                          )}
                        </button>
                      </div>
                    </summary>
                    <div className="case-detail">
                      <div className="detail-grid">
                        <div>
                          <p className="detail-label">主要用途</p>
                          <p className="detail-value">{ticket.purpose}</p>
                        </div>
                        <div>
                          <p className="detail-label">申請類別</p>
                          <p className="detail-value">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="detail-label">成品尺寸</p>
                          <p className="detail-value">{getSizeLabel(ticket)}</p>
                        </div>
                      </div>
                      {renderDescription(ticket)}
                    </div>
                  </details>
                ))}
                {scopedTickets.length === 0 ? (
                  <div className="empty-state">目前沒有待審核案件</div>
                ) : null}
              </div>
              {scopedTickets.length > 5 ? (
                <button
                  className="ghost-btn mobile-toggle"
                  type="button"
                  onClick={() =>
                    setIsApproverPendingExpanded((prev) => !prev)
                  }
                  aria-expanded={isApproverPendingExpanded}
                >
                  {isApproverPendingExpanded ? "收合" : "展開全部"} ▼
                </button>
              ) : null}
            </section>
            <section className="panel">
              <div className="panel-head">
                <h3>處理中</h3>
                <span className="panel-note">已核准並處理中案件</span>
              </div>
              <div
                className={`case-list capped-list${
                  isApproverActiveExpanded ? " expanded" : ""
                }`}
              >
                {approverActiveTickets.map((ticket) => (
                  <details key={ticket.id} className="case-item">
                    <summary className="case-summary">
                      <div>
                        <p className="item-title">
                          {ticket.code}｜{ticket.category}
                        </p>
                        <p className="item-note">
                          {ticket.unit}｜{ticket.applicantName}
                        </p>
                      </div>
                      <span className="status-badge">
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                    </summary>
                    <div className="case-detail">
                      <div className="detail-grid">
                        <div>
                          <p className="detail-label">主要用途</p>
                          <p className="detail-value">{ticket.purpose}</p>
                        </div>
                        <div>
                          <p className="detail-label">申請類別</p>
                          <p className="detail-value">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="detail-label">成品尺寸</p>
                          <p className="detail-value">{getSizeLabel(ticket)}</p>
                        </div>
                      </div>
                      {renderDescription(ticket)}
                    </div>
                  </details>
                ))}
                {approverActiveTickets.length === 0 ? (
                  <div className="empty-state">目前沒有製作中案件</div>
                ) : null}
              </div>
              {approverActiveTickets.length > 5 ? (
                <button
                  className="ghost-btn mobile-toggle"
                  type="button"
                  onClick={() => setIsApproverActiveExpanded((prev) => !prev)}
                  aria-expanded={isApproverActiveExpanded}
                >
                  {isApproverActiveExpanded ? "收合" : "展開全部"} ▼
                </button>
              ) : null}
            </section>
          </div>
        ) : null}

        <section className="panel">
          <div className="panel-head">
            <h3>案件清單</h3>
            <div className="panel-actions">
              <span className="panel-note">
                {isLoading ? (
                  <>
                    <span className="inline-spinner" aria-hidden="true" />
                    讀取中
                  </>
                ) : (
                  "可搜尋、篩選、排序"
                )}
              </span>
              {role === "lead" ? (
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handleExportCsv}
                >
                  匯出 Excel
                </button>
              ) : null}
            </div>
          </div>
          <div className="toolbar">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="搜尋案件編號或單位"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="table-area">
            {isLoading ? (
              <div className="table-loading" aria-live="polite">
                <span className="inline-spinner" aria-hidden="true" />
                讀取中
              </div>
            ) : null}
            <div className="table-wrap">
              <table>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header.key}
                      onClick={() => handleSort(header.key)}
                    >
                      {header.label}{" "}
                      <span className="sort-indicator">
                        {sortKey === header.key
                          ? sortDirection === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {allSortedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="table-row"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <td>{ticket.code}</td>
                      <td>{ticket.unit}</td>
                      <td>{ticket.applicantName}</td>
                    <td>{ticket.roleType}</td>
                    <td>{ticket.ext}</td>
                    <td>{ticket.purpose}</td>
                    <td>{ticket.category}</td>
                    <td>{getSizeLabel(ticket)}</td>
                    <td>{statusLabels[ticket.status] || ticket.status}</td>
                    <td>{getAssigneeLabel(ticket)}</td>
                  </tr>
                ))}
                {allSortedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={10}>無符合條件的案件</td>
                  </tr>
                ) : null}
              </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
