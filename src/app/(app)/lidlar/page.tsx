"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FileSignature, MessageSquare, Phone, Plus } from "lucide-react";
import { addLead, addLeadComment, createContractFromLead, setLeadCertificate, setLeadStatus, useDb } from "@/lib/data/store";
import { branchScope, groupLabel, lookups, studentName, TODAY } from "@/lib/data/calc";
import { ADDRESSES, LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/data/types";
import { cn, date, phone } from "@/lib/format";
import { Badge, Button, Card, CertificatePreview, Empty, Field, Input, Modal, PageHeader, SearchInput, Select, Table, Tabs, Td, Textarea, Th, type Tone } from "@/components/ui";

const STATUS_TONE: Record<string, Tone> = { "1": "accent", "2": "info", "3": "primary", "4": "primary", "5": "success", "6": "neutral", "7": "neutral" };
const leadTone = (s: LeadStatus) => STATUS_TONE[s[0]];

export default function LeadsPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const all = db.leads.filter((l) => scope.includes(l.branchId));
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const l of all) c[l.status[0]] = (c[l.status[0]] ?? 0) + 1;
    return c;
  }, [all]);

  const rows = all
    .filter((l) => tab === "all" || l.status[0] === tab)
    .filter((l) => {
      if (!q) return true;
      const hay = `${studentName(L, l.studentId)} ${l.fatherName} ${l.motherName} ${l.fatherPhone} ${l.address}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const current = openId ? db.leads.find((l) => l.id === openId) : null;

  return (
    <>
      <PageHeader
        title="Lidlar"
        subtitle="Murojaat qilgan ota-onalar va sinov darslari"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" /> Yangi lid
          </Button>
        }
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: "all", label: "Hammasi", count: counts.all },
          ...LEAD_STATUSES.map((s) => ({ value: s[0], label: s.slice(3), count: counts[s[0]] ?? 0 })),
        ]}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Ism, telefon yoki manzil" />
          <p className="text-sm text-muted">{rows.length} ta lid</p>
        </div>
        {rows.length === 0 ? (
          <Empty title="Lid topilmadi" hint="Qidiruv yoki filtrni oʻzgartirib koʻring" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Murojaatchi</Th>
                <Th>Status</Th>
                <Th>Filial</Th>
                <Th>Yosh</Th>
                <Th>Ota-ona</Th>
                <Th>Manba</Th>
                <Th>Sinov darsi</Th>
                <Th>Qoʻshilgan</Th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((l) => (
                <tr key={l.id} className="cursor-pointer hover:bg-surface-2" onClick={() => setOpenId(l.id)}>
                  <Td>
                    <button type="button" className="text-left font-semibold hover:text-primary" onClick={() => setOpenId(l.id)}>
                      {studentName(L, l.studentId)}
                    </button>
                    <p className="text-xs text-muted">{l.address}</p>
                  </Td>
                  <Td>
                    <Badge tone={leadTone(l.status)}>{l.status.slice(3)}</Badge>
                  </Td>
                  <Td>{L.branch.get(l.branchId)?.name}</Td>
                  <Td>{l.ageGroup} yosh</Td>
                  <Td>
                    <p>{l.fatherName}</p>
                    <p className="text-xs text-muted">{phone(l.fatherPhone)}</p>
                  </Td>
                  <Td>{L.source.get(l.sourceId)?.name}</Td>
                  <Td>{date(l.demoDate)}</Td>
                  <Td className="text-muted">{date(l.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {current && <LeadDetail lead={current} onClose={() => setOpenId(null)} />}
      <NewLead open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { db, session } = useDb();
  const L = lookups(db);
  const router = useRouter();
  const [note, setNote] = useState("");
  const [needsCertificate, setNeedsCertificate] = useState(false);
  const comments = db.leadComments.filter((c) => c.leadId === lead.id);
  const contract = db.contracts.find((c) => c.studentId === lead.studentId);
  const groups = db.groups.filter((g) => g.branchId === lead.branchId && g.status !== "Nofaol");
  const needsGroup = ["3", "4", "5"].includes(lead.status[0]);
  const STARTED = LEAD_STATUSES[4];
  const changeStatus = (s: LeadStatus) => {
    // The birth certificate is mandatory before a child can start.
    if (s === STARTED && !lead.certificate && !contract) return setNeedsCertificate(true);
    setNeedsCertificate(false);
    setLeadStatus(lead.id, s);
  };
  const upload = (file: File | undefined) => {
    if (!file) return;
    setLeadCertificate(lead.id, { name: file.name, url: URL.createObjectURL(file), isImage: file.type.startsWith("image/") });
    if (needsCertificate) {
      setLeadStatus(lead.id, STARTED);
      setNeedsCertificate(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={studentName(L, lead.studentId)}
      footer={
        contract ? (
          <Button onClick={() => router.push(`/shartnomalar/korish?id=${contract.id}`)}>
            <FileSignature size={16} aria-hidden="true" /> Shartnomani ochish
          </Button>
        ) : lead.status.startsWith("5") ? (
          <Button
            disabled={!lead.groupId || !lead.certificate}
            onClick={() => {
              const id = createContractFromLead(lead.id);
              if (id) router.push(`/shartnomalar/korish?id=${id}`);
            }}
          >
            <FileSignature size={16} aria-hidden="true" /> Shartnoma tuzish
          </Button>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Yopish
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Status">
            {(id) => (
              <Select id={id} value={lead.status} onChange={(e) => changeStatus(e.target.value as LeadStatus)}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            )}
          </Field>
          {(needsCertificate || (lead.status === STARTED && !contract)) && (
            <div className={cn("flex flex-col gap-3 rounded-xl border p-4", lead.certificate ? "border-border" : "border-warning/40 bg-warning-soft")}>
              <Field label="Tugʻilganlik guvohnomasi (metrika)" hint={lead.certificate ? undefined : "“Oʻqishni boshladi” statusi uchun metrikani yuklash majburiy"}>
                {(id) => <input id={id} type="file" accept="image/*,application/pdf" onChange={(e) => upload(e.target.files?.[0])} className="text-sm file:mr-3 file:h-9 file:rounded-lg file:border file:border-border-strong file:bg-surface file:px-3 file:text-sm file:font-semibold" />}
              </Field>
              {lead.certificate && <CertificatePreview file={lead.certificate} />}
            </div>
          )}
          {needsGroup && (
            <Field label="Guruh" hint={lead.status.startsWith("5") && !lead.groupId ? "Shartnoma tuzish uchun guruh tanlang" : undefined}>
              {(id) => (
                <Select id={id} value={lead.groupId ?? ""} onChange={(e) => setLeadStatus(lead.id, lead.status, e.target.value || null)}>
                  <option value="">Tanlang…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {groupLabel(L, g.id)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface-2 p-4 text-sm">
            <dt className="text-muted">Filial</dt>
            <dd className="font-semibold">{L.branch.get(lead.branchId)?.name}</dd>
            <dt className="text-muted">Yosh guruhi</dt>
            <dd className="font-semibold">{lead.ageGroup} yosh</dd>
            <dt className="text-muted">Manzil</dt>
            <dd className="font-semibold">{lead.address}</dd>
            <dt className="text-muted">Manba</dt>
            <dd className="font-semibold">{L.source.get(lead.sourceId)?.name}</dd>
            <dt className="text-muted">Sinov darsi</dt>
            <dd className="font-semibold">{date(lead.demoDate)}</dd>
          </dl>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a href={`tel:+998${lead.fatherPhone}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-2">
              <Phone size={18} className="text-primary" aria-hidden="true" />
              <span className="text-sm">
                <span className="block font-semibold">{lead.fatherName} (ota)</span>
                <span className="num text-muted">{phone(lead.fatherPhone)}</span>
              </span>
            </a>
            {lead.motherPhone && (
              <a href={`tel:+998${lead.motherPhone}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-2">
                <Phone size={18} className="text-primary" aria-hidden="true" />
                <span className="text-sm">
                  <span className="block font-semibold">{lead.motherName} (ona)</span>
                  <span className="num text-muted">{phone(lead.motherPhone)}</span>
                </span>
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <MessageSquare size={16} aria-hidden="true" /> Izohlar
          </h3>
          <ul className="flex flex-col gap-3">
            {comments.length === 0 && <li className="text-sm text-muted">Hali izoh yoʻq</li>}
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-surface-2 p-3 text-sm">
                <p>{c.text}</p>
                <p className="mt-1 text-xs text-muted">
                  {L.user.get(c.createdBy)?.fullName} · {date(c.createdAt)}
                </p>
              </li>
            ))}
          </ul>
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              addLeadComment(lead.id, note.trim(), session.userId);
              setNote("");
            }}
          >
            <label htmlFor="lead-note" className="sr-only">
              Yangi izoh
            </label>
            <Textarea id="lead-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qoʻngʻiroq natijasi, kelishuv…" />
            <Button type="submit" variant="secondary" className="self-end">
              Izoh qoʻshish
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

function NewLead({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const branches = db.branches.filter((b) => scope.includes(b.id));
  const empty = { branchId: branches[0]?.id ?? "", first: "", last: "", gender: "Erkak", age: "3", address: ADDRESSES[0], source: db.leadSources[0].id, father: "", fphone: "", mother: "", mphone: "", status: LEAD_STATUSES[0] as LeadStatus };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const valid = f.first.length >= 3 && f.last.length >= 3 && /^\d{9}$/.test(f.fphone);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Yangi lid"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              addLead(
                { branchId: f.branchId, firstName: f.first, lastName: f.last, parentName: "", gender: f.gender as "Erkak", birthDate: "" },
                { branchId: f.branchId, sourceId: f.source, status: f.status, groupId: null, address: f.address, ageGroup: Number(f.age), fatherName: f.father, motherName: f.mother, fatherPhone: f.fphone, motherPhone: f.mphone, demoDate: null, certificate: null, createdBy: session.userId },
              );
              setF(empty);
              onClose();
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Filial">
          {(id) => (
            <Select id={id} value={f.branchId} onChange={set("branchId")}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Manba">
          {(id) => (
            <Select id={id} value={f.source} onChange={set("source")}>
              {db.leadSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Bolaning ismi">{(id) => <Input id={id} value={f.first} onChange={set("first")} placeholder="Masalan, Oysha" />}</Field>
        <Field label="Familiyasi">{(id) => <Input id={id} value={f.last} onChange={set("last")} />}</Field>
        <Field label="Jinsi">
          {(id) => (
            <Select id={id} value={f.gender} onChange={set("gender")}>
              <option>Erkak</option>
              <option>Ayol</option>
            </Select>
          )}
        </Field>
        <Field label="Yoshi">
          {(id) => (
            <Select id={id} value={f.age} onChange={set("age")}>
              {[2, 3, 4, 5, 6, 7].map((a) => (
                <option key={a} value={a}>
                  {a} yosh
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Manzil">
          {(id) => (
            <Select id={id} value={f.address} onChange={set("address")}>
              {ADDRESSES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={f.status} onChange={set("status")}>
              {LEAD_STATUSES.slice(0, 4).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Otasining ismi">{(id) => <Input id={id} value={f.father} onChange={set("father")} />}</Field>
        <Field label="Otasining telefoni" hint="9 ta raqam, masalan 901234567">
          {(id) => <Input id={id} inputMode="numeric" value={f.fphone} onChange={set("fphone")} className={cn(f.fphone && !/^\d{9}$/.test(f.fphone) && "border-danger")} />}
        </Field>
        <Field label="Onasining ismi">{(id) => <Input id={id} value={f.mother} onChange={set("mother")} />}</Field>
        <Field label="Onasining telefoni">{(id) => <Input id={id} inputMode="numeric" value={f.mphone} onChange={set("mphone")} />}</Field>
      </div>
      <p className="mt-4 text-xs text-muted">Qoʻshilgan sana: {date(TODAY)}</p>
    </Modal>
  );
}
