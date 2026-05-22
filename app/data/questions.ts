import {
  AreaChart,
  Bell,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Factory,
  FileSearch,
  FileText,
  FolderOpen,
  Handshake,
  HeartPulse,
  HelpCircle,
  LineChart,
  Mail,
  MessageSquare,
  Microscope,
  PackageCheck,
  Repeat2,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type QuestionType = "single" | "multi" | "text" | "file";

export type QuestionOption = {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
};

export type Question = {
  id:
    | "department"
    | "affected_area"
    | "work_type"
    | "friction"
    | "frequency"
    | "people_impacted"
    | "expected_support"
    | "systems_involved"
    | "desired_outcome"
    | "attachments";
  title: string;
  eyebrow: string;
  helper: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
};

export const questions: Question[] = [
  {
    id: "department",
    eyebrow: "Start with context",
    title: "Which department owns this request?",
    helper: "This helps route the opportunity to the right reviewers.",
    type: "single",
    options: [
      { label: "Sales", value: "Sales", icon: Handshake },
      { label: "HR", value: "HR", icon: Users },
      { label: "Finance", value: "Finance", icon: LineChart },
      { label: "Supply Chain", value: "Supply Chain", icon: PackageCheck },
      { label: "Manufacturing", value: "Manufacturing", icon: Factory },
      { label: "IT", value: "IT", icon: Wrench },
      { label: "Medical", value: "Medical", icon: HeartPulse },
      { label: "R&D", value: "R&D", icon: Microscope },
      { label: "Other", value: "Other", icon: Building2 },
    ],
  },
  {
    id: "affected_area",
    eyebrow: "Business area",
    title: "Which area is most affected?",
    helper: "Pick the closest match. You can refine details later.",
    type: "single",
    options: [
      { label: "Reporting", value: "Reporting", icon: AreaChart },
      { label: "Operations", value: "Operations", icon: Workflow },
      { label: "Documentation", value: "Documentation", icon: FileText },
      { label: "Approvals", value: "Approvals", icon: CheckCircle2 },
      { label: "Communication", value: "Communication", icon: MessageSquare },
      { label: "Data Analysis", value: "Data Analysis", icon: Database },
      { label: "Compliance", value: "Compliance", icon: ShieldCheck },
      { label: "Customer Support", value: "Customer Support", icon: HelpCircle },
    ],
  },
  {
    id: "work_type",
    eyebrow: "Current work",
    title: "What best describes the current work?",
    helper: "This flags whether the request is likely automation, AI, analytics, or workflow.",
    type: "single",
    options: [
      { label: "Manual repetitive work", value: "Manual repetitive work", icon: Repeat2 },
      { label: "Searching through files/data", value: "Searching through files/data", icon: Search },
      { label: "Preparing recurring reports", value: "Preparing recurring reports", icon: ClipboardList },
      { label: "Copy-pasting between systems", value: "Copy-pasting between systems", icon: Workflow },
      { label: "Tracking approvals/follow-ups", value: "Tracking approvals/follow-ups", icon: CheckCircle2 },
      { label: "Reviewing documents manually", value: "Reviewing documents manually", icon: FileSearch },
      { label: "Data spread across systems", value: "Data spread across systems", icon: Database },
      { label: "Decision-making based on data", value: "Decision-making based on data", icon: BrainCircuit },
    ],
  },
  {
    id: "friction",
    eyebrow: "Pain point",
    title: "What creates the biggest friction?",
    helper: "Choose the blocker that costs the most time or confidence.",
    type: "single",
    options: [
      { label: "Too much manual effort", value: "Too much manual effort", icon: Repeat2 },
      { label: "Human dependency", value: "Human dependency", icon: Users },
      { label: "Slow turnaround", value: "Slow turnaround", icon: Bell },
      { label: "Errors/rework", value: "Errors/rework", icon: Wrench },
      { label: "Lack of visibility", value: "Lack of visibility", icon: Search },
      { label: "Too many documents", value: "Too many documents", icon: FileText },
      { label: "Repeated communication", value: "Repeated communication", icon: MessageSquare },
      { label: "No centralized system", value: "No centralized system", icon: FolderOpen },
    ],
  },
  {
    id: "frequency",
    eyebrow: "Frequency",
    title: "How often does this happen?",
    helper: "Frequency is one of the strongest prioritization signals.",
    type: "single",
    options: [
      { label: "Multiple times daily", value: "Multiple times daily" },
      { label: "Daily", value: "Daily" },
      { label: "Weekly", value: "Weekly" },
      { label: "Monthly", value: "Monthly" },
      { label: "Occasionally", value: "Occasionally" },
    ],
  },
  {
    id: "people_impacted",
    eyebrow: "Impact",
    title: "How many people are impacted?",
    helper: "A rough scope is enough for the first review.",
    type: "single",
    options: [
      { label: "Only me", value: "Only me", icon: Users },
      { label: "My team", value: "My team", icon: Users },
      { label: "Multiple teams", value: "Multiple teams", icon: Building2 },
      { label: "Entire department", value: "Entire department", icon: Sparkles },
    ],
  },
  {
    id: "expected_support",
    eyebrow: "Best-fit support",
    title: "What kind of support would help most?",
    helper: "No pressure to know the solution. An informed guess is useful.",
    type: "single",
    options: [
      { label: "Automation", value: "Automation", icon: Workflow },
      { label: "AI assistant", value: "AI assistant", icon: BrainCircuit },
      { label: "Dashboard/reporting", value: "Dashboard/reporting", icon: AreaChart },
      { label: "Smart search", value: "Smart search", icon: Search },
      { label: "Alerts/reminders", value: "Alerts/reminders", icon: Bell },
      { label: "Workflow system", value: "Workflow system", icon: ClipboardList },
      { label: "Unsure", value: "Unsure", icon: HelpCircle },
    ],
  },
  {
    id: "systems_involved",
    eyebrow: "Systems",
    title: "Which systems or files are involved?",
    helper: "Select all that apply.",
    type: "multi",
    options: [
      { label: "Excel", value: "Excel", icon: Table2 },
      { label: "PDFs", value: "PDFs", icon: FileText },
      { label: "SAP", value: "SAP", icon: Database },
      { label: "Emails", value: "Emails", icon: Mail },
      { label: "Shared folders", value: "Shared folders", icon: FolderOpen },
      { label: "Power BI", value: "Power BI", icon: AreaChart },
      { label: "Images/scans", value: "Images/scans", icon: FileSearch },
      { label: "Multiple systems", value: "Multiple systems", icon: Workflow },
    ],
  },
  {
    id: "desired_outcome",
    eyebrow: "Desired outcome",
    title: "What is one thing you wish became easier?",
    helper: "Short answer only. A sentence fragment is perfect.",
    type: "text",
    placeholder: "Example: finding the latest vendor compliance documents",
  },
  {
    id: "attachments",
    eyebrow: "Optional evidence",
    title: "Add a supporting file if it helps.",
    helper: "Upload is captured locally in the review for now. Supabase Storage can be connected next.",
    type: "file",
  },
];

export const submissionFields = questions.filter((question) => question.id !== "attachments");
