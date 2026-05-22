import {
  FileText,
  Users,
  LineChart,
  PackageCheck,
  Factory,
  Wrench,
  HeartPulse,
  Microscope,
  Building2,
  Handshake,
  AreaChart,
  Workflow,
  CheckCircle2,
  MessageSquare,
  Database,
  ShieldCheck,
  HelpCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  FolderOpen,
  Mail,
  FileSearch,
  BrainCircuit,
  Settings,
  UploadCloud,
  Layers,
  FileCode,
  ShieldAlert,
  Target,
  Flame,
  Award
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type QuestionType = "single" | "multi" | "text" | "short_text" | "file";

export type QuestionOption = {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
};

export type Question = {
  id: string;
  title: string;
  eyebrow: string;
  helper: string;
  type: QuestionType;
  options?: QuestionOption[];
  placeholder?: string;
};

export type Section = {
  id: string;
  title: string;
  explanation: string;
  questions: Question[];
};

export const sections: Section[] = [
  {
    id: "ownership",
    title: "Request Ownership",
    explanation: "Help us understand who is requesting this opportunity and which teams are most impacted.",
    questions: [
      {
        id: "department",
        eyebrow: "Department Ownership",
        title: "Help us with your department",
        helper: "Which department owns this request? Choose 'Other' if your team is not listed.",
        type: "single",
        options: [
          { label: "Sales", value: "Sales", icon: Handshake },
          { label: "Marketing", value: "Marketing", icon: AreaChart },
          { label: "HR", value: "HR", icon: Users },
          { label: "Finance", value: "Finance", icon: LineChart },
          { label: "Procurement", value: "Procurement", icon: Briefcase },
          { label: "Supply Chain", value: "Supply Chain", icon: PackageCheck },
          { label: "Manufacturing", value: "Manufacturing", icon: Factory },
          { label: "Quality", value: "Quality", icon: ShieldCheck },
          { label: "Regulatory Affairs", value: "Regulatory Affairs", icon: FileText },
          { label: "Medical Affairs", value: "Medical Affairs", icon: HeartPulse },
          { label: "Pharmacovigilance", value: "Pharmacovigilance", icon: ShieldAlert },
          { label: "R&D", value: "R&D", icon: Microscope },
          { label: "IT", value: "IT", icon: Wrench },
          { label: "Legal / Compliance", value: "Legal / Compliance", icon: ShieldCheck },
          { label: "Other", value: "Other", icon: Building2 }
        ]
      },
      {
        id: "affected_area",
        eyebrow: "Process Area Impacted",
        title: "Which area or process is most affected?",
        helper: "Select the operational workflows experiencing friction. Select all that apply.",
        type: "multi",
        options: [
          { label: "Reporting", value: "Reporting", icon: AreaChart },
          { label: "Operations", value: "Operations", icon: Workflow },
          { label: "Documentation", value: "Documentation", icon: FileText },
          { label: "Approvals", value: "Approvals", icon: CheckCircle2 },
          { label: "Communication", value: "Communication", icon: MessageSquare },
          { label: "Data Analysis", value: "Data Analysis", icon: Database },
          { label: "Compliance", value: "Compliance", icon: ShieldCheck },
          { label: "Customer / Stakeholder Support", value: "Customer / Stakeholder Support", icon: HelpCircle },
          { label: "Planning and Tracking", value: "Planning and Tracking", icon: Clock },
          { label: "Knowledge Search", value: "Knowledge Search", icon: Microscope },
          { label: "Other", value: "Other", icon: Building2 }
        ]
      }
    ]
  },
  {
    id: "pain_point",
    title: "Current Pain Point",
    explanation: "Describe the current manual task or process bottleneck causing team friction.",
    questions: [
      {
        id: "pain_point_desc",
        eyebrow: "Process Friction Description",
        title: "What task or process is difficult today?",
        helper: "Briefly explain the current workflow step that is time-consuming, error-prone, or manual.",
        type: "text",
        placeholder: "Example: Manual compilation of regional safety reporting sheets across multiple systems into a monthly regulatory report..."
      },
      {
        id: "friction",
        eyebrow: "Friction Trigger",
        title: "What creates the biggest friction?",
        helper: "Identify the root cause of complexity or delays. Select all that apply.",
        type: "multi",
        options: [
          { label: "Manual repetitive work", value: "Manual repetitive work" },
          { label: "Searching through files or data", value: "Searching through files or data" },
          { label: "Preparing recurring reports", value: "Preparing recurring reports" },
          { label: "Copy-pasting between systems", value: "Copy-pasting between systems" },
          { label: "Tracking approvals or follow-ups", value: "Tracking approvals or follow-ups" },
          { label: "Reviewing documents manually", value: "Reviewing documents manually" },
          { label: "Data spread across multiple systems", value: "Data spread across multiple systems" },
          { label: "Decision-making based on data", value: "Decision-making based on data" },
          { label: "Responding to repeated queries", value: "Responding to repeated queries" },
          { label: "Comparing information across documents", value: "Comparing information across documents" },
          { label: "Data collection", value: "Data collection" },
          { label: "Document search", value: "Document search" },
          { label: "Document review", value: "Document review" },
          { label: "Report preparation", value: "Report preparation" },
          { label: "Approval", value: "Approval" },
          { label: "Follow-up", value: "Follow-up" },
          { label: "Decision-making", value: "Decision-making" },
          { label: "Handover between teams", value: "Handover between teams" },
          { label: "System limitation", value: "System limitation" },
          { label: "Communication gap", value: "Communication gap" },
          { label: "Not sure", value: "Not sure" }
        ]
      }
    ]
  },
  {
    id: "frequency_impact",
    title: "Frequency & Impact",
    explanation: "Help us evaluate the scope and urgency of this request by defining volume and impact.",
    questions: [
      {
        id: "frequency",
        eyebrow: "Friction Frequency",
        title: "How often does this happen?",
        helper: "How frequently do you perform this manual task?",
        type: "single",
        options: [
          { label: "Multiple times daily", value: "Multiple times daily" },
          { label: "Daily", value: "Daily" },
          { label: "Weekly", value: "Weekly" },
          { label: "Monthly", value: "Monthly" },
          { label: "Quarterly", value: "Quarterly" },
          { label: "Occasionally", value: "Occasionally" }
        ]
      },
      {
        id: "time_spent",
        eyebrow: "Time Spent",
        title: "How much time is spent on this activity each time?",
        helper: "A rough estimate of hours per task cycle.",
        type: "single",
        options: [
          { label: "Less than 15 minutes", value: "Less than 15 minutes" },
          { label: "15–30 minutes", value: "15–30 minutes" },
          { label: "30–60 minutes", value: "30–60 minutes" },
          { label: "1–3 hours", value: "1–3 hours" },
          { label: "Half day", value: "Half day" },
          { label: "Full day or more", value: "Full day or more" },
          { label: "Not sure", value: "Not sure" }
        ]
      },
      {
        id: "people_impacted",
        eyebrow: "Colleague Scope",
        title: "How many people are impacted by this issue?",
        helper: "How many Glenmark colleagues face this same bottleneck?",
        type: "single",
        options: [
          { label: "Only me", value: "Only me" },
          { label: "2–5 people", value: "2–5 people" },
          { label: "6–20 people", value: "6–20 people" },
          { label: "More than 20 people", value: "More than 20 people" },
          { label: "Entire department", value: "Entire department" },
          { label: "Multiple departments", value: "Multiple departments" }
        ]
      },
      {
        id: "business_impact",
        eyebrow: "Business Drivers",
        title: "What is the business impact if this is solved?",
        helper: "Select all key benefits Glenmark receives by resolving this issue.",
        type: "multi",
        options: [
          { label: "Saves time", value: "Saves time", icon: Clock },
          { label: "Reduces errors", value: "Reduces errors", icon: ShieldCheck },
          { label: "Reduces cost", value: "Reduces cost", icon: LineChart },
          { label: "Improves compliance", value: "Improves compliance", icon: ShieldCheck },
          { label: "Improves visibility", value: "Improves visibility", icon: AreaChart },
          { label: "Improves decision-making", value: "Improves decision-making", icon: BrainCircuit },
          { label: "Improves employee productivity", value: "Improves employee productivity", icon: Users },
          { label: "Improves customer response", value: "Improves customer response", icon: HelpCircle },
          { label: "Reduces dependency on individuals", value: "Reduces dependency on individuals", icon: Building2 },
          { label: "Speeds up approvals", value: "Speeds up approvals", icon: CheckCircle2 },
          { label: "Improves reporting accuracy", value: "Improves reporting accuracy", icon: LineChart },
          { label: "Other", value: "Other", icon: Briefcase }
        ]
      },
      {
        id: "urgency",
        eyebrow: "Business Urgency",
        title: "How urgent is this requirement?",
        helper: "Triage prioritization signal. Choose High or Critical only if direct operation bottlenecks exist.",
        type: "single",
        options: [
          { label: "Low", value: "Low" },
          { label: "Medium", value: "Medium" },
          { label: "High", value: "High" },
          { label: "Critical", value: "Critical" }
        ]
      }
    ]
  },
  {
    id: "systems_data",
    title: "Systems, Data & Documents",
    explanation: "Identify the software tools, database servers, and paperwork involved in this workflow.",
    questions: [
      {
        id: "systems_involved",
        eyebrow: "Software Tools & Files",
        title: "Which systems, files, or data sources are involved?",
        helper: "Select all sources that apply.",
        type: "multi",
        options: [
          { label: "Excel", value: "Excel", icon: Database },
          { label: "PDFs", value: "PDFs", icon: FileText },
          { label: "Word Documents", value: "Word Documents", icon: FileText },
          { label: "Emails", value: "Emails", icon: Mail },
          { label: "SAP", value: "SAP", icon: Settings },
          { label: "Power BI", value: "Power BI", icon: LineChart },
          { label: "Shared Folders", value: "Shared Folders", icon: FolderOpen },
          { label: "Images or Scanned Documents", value: "Images or Scanned Documents", icon: FileSearch },
          { label: "CRM", value: "CRM", icon: Handshake },
          { label: "HRMS", value: "HRMS", icon: Users },
          { label: "QMS", value: "QMS", icon: ShieldCheck },
          { label: "DMS", value: "DMS", icon: FolderOpen },
          { label: "LIMS", value: "LIMS", icon: Microscope },
          { label: "Multiple Systems", value: "Multiple Systems", icon: Workflow },
          { label: "Other", value: "Other", icon: Building2 }
        ]
      },
      {
        id: "information_involved",
        eyebrow: "Information Classes",
        title: "What type of information is involved?",
        helper: "Select all categories of business data processed in this task.",
        type: "multi",
        options: [
          { label: "Sales Data", value: "Sales Data" },
          { label: "Financial Data", value: "Financial Data" },
          { label: "Employee Data", value: "Employee Data" },
          { label: "Vendor Data", value: "Vendor Data" },
          { label: "Manufacturing Data", value: "Manufacturing Data" },
          { label: "Quality Documents", value: "Quality Documents" },
          { label: "Regulatory Documents", value: "Regulatory Documents" },
          { label: "Medical or Scientific Data", value: "Medical or Scientific Data" },
          { label: "Customer Data", value: "Customer Data" },
          { label: "Product Data", value: "Product Data" },
          { label: "Audit or Compliance Data", value: "Audit or Compliance Data" },
          { label: "General Business Data", value: "General Business Data" },
          { label: "Other", value: "Other" }
        ]
      },
      {
        id: "confidential_data",
        eyebrow: "Data Protection & Regulated Data",
        title: "Does this involve confidential, sensitive or regulated data?",
        helper: "Glenmark compliance check for high-risk clinical, commercial, or personnel data.",
        type: "single",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
          { label: "Not Sure", value: "Not Sure" }
        ]
      }
    ]
  },
  {
    id: "outcome",
    title: "Desired Outcome",
    explanation: "Define your dream future state and what support type fits best.",
    questions: [
      {
        id: "desired_outcome_short",
        eyebrow: "Simplification Target",
        title: "What is one thing you wish became easier?",
        helper: "Briefly complete this sentence: 'I wish I could...'",
        type: "short_text",
        placeholder: "Example: find approved formulation datasheets by ingredient name instantly..."
      },
      {
        id: "expected_support",
        eyebrow: "Technical Support fit",
        title: "What kind of support would help most?",
        helper: "Select the primary technical automation mechanism required.",
        type: "single",
        options: [
          { label: "Automation", value: "Automation", icon: Workflow },
          { label: "AI Assistant / Chatbot", value: "AI Assistant / Chatbot", icon: BrainCircuit },
          { label: "Dashboard or Reporting", value: "Dashboard or Reporting", icon: AreaChart },
          { label: "Smart Search", value: "Smart Search", icon: FileSearch },
          { label: "Alerts or Reminders", value: "Alerts or Reminders", icon: Clock },
          { label: "Workflow or Approval System", value: "Workflow or Approval System", icon: CheckCircle2 },
          { label: "Document Summarization", value: "Document Summarization", icon: FileText },
          { label: "Data Extraction", value: "Data Extraction", icon: Database },
          { label: "Data Analysis", value: "Data Analysis", icon: LineChart },
          { label: "Not Sure", value: "Not Sure", icon: HelpCircle }
        ]
      },
      {
        id: "solution_goals",
        eyebrow: "Success Indicators",
        title: "What should a successful solution achieve?",
        helper: "Select all targets that indicate success. Select all that apply.",
        type: "multi",
        options: [
          { label: "Reduce manual effort", value: "Reduce manual effort" },
          { label: "Reduce turnaround time", value: "Reduce turnaround time" },
          { label: "Reduce errors", value: "Reduce errors" },
          { label: "Improve tracking", value: "Improve tracking" },
          { label: "Improve reporting", value: "Improve reporting" },
          { label: "Improve compliance", value: "Improve compliance" },
          { label: "Improve user experience", value: "Improve user experience" },
          { label: "Improve decision quality", value: "Improve decision quality" },
          { label: "Reduce follow-ups", value: "Reduce follow-ups" },
          { label: "Improve data visibility", value: "Improve data visibility" }
        ]
      }
    ]
  }
];

// Flat array of all questions for backward-compatibility & mapping
export const questions: Question[] = sections.flatMap((section) => section.questions);

// Helper function to map a flat list of key-value pairs back to readable values
export const getQuestionById = (id: string): Question | undefined => {
  return questions.find((q) => q.id === id);
};
