import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = (await request.json()) as {
    status?: TicketStatus;
    assignedToName?: string | null;
    unit?: string;
    applicantName?: string;
    roleType?: string;
    ext?: string;
    purpose?: string;
    category?: string;
  };

  try {
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: payload.status,
        assignedToName: payload.assignedToName ?? undefined,
        unit: payload.unit,
        applicantName: payload.applicantName,
        roleType: payload.roleType,
        ext: payload.ext,
        purpose: payload.purpose,
        category: payload.category,
      },
    });

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.ticket.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
