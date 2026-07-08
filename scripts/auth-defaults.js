/**
 * @fileoverview Default data used for guest sessions.
 * Provides a guest user object, a list of pre-defined demo contacts,
 * and a set of sample tasks that are loaded when a user logs in as guest.
 */

/**
 * Default guest user object used when no authenticated user is present.
 * @type {{id: string, name: string, email: string, isGuest: boolean}}
 */
const GUEST_USER = {
  id: "guest",
  name: "Gast",
  email: "guest@join.com",
  isGuest: true,
};

/**
 * List of pre-defined demo contacts loaded for guest users.
 * @type {Array<{id: number, name: string, email: string, phone: string, color: string, initials: string}>}
 */
const DEFAULT_CONTACTS = [
  {
    id: 1,
    name: "Anja Schulz",
    email: "schulz@hotmail.com",
    phone: "+49 1111 11 111 1",
    color: "#AB47BC",
    initials: "AS",
  },
  {
    id: 2,
    name: "Benedikt Ziegler",
    email: "ziegler@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#FF9800",
    initials: "BZ",
  },
  {
    id: 3,
    name: "David Eisenberg",
    email: "davidberg@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#5C6BC0",
    initials: "DE",
  },
  {
    id: 4,
    name: "Eva Fischer",
    email: "eva.fischer@hotmail.com",
    phone: "+49 1111 11 111 1",
    color: "#26A69A",
    initials: "EF",
  },
  {
    id: 5,
    name: "Emmanuel Mauer",
    email: "emmanuelma@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#26A69A",
    initials: "EM",
  },
  {
    id: 6,
    name: "Marcel Bauer",
    email: "bauer@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#6A1B9A",
    initials: "MB",
  },
  {
    id: 7,
    name: "Tatjana Wolf",
    email: "wolf.t@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#FF5722",
    initials: "TW",
  },
  {
    id: 8,
    name: "Anton Müller",
    email: "a.mueller@web.de",
    phone: "+49 1111 11 111 1",
    color: "#795548",
    initials: "AM",
  },
  {
    id: 9,
    name: "Sophie Krüger",
    email: "skrueger@outlook.com",
    phone: "+49 1111 11 111 1",
    color: "#E91E63",
    initials: "SK",
  },
  {
    id: 10,
    name: "Jan Schmidt",
    email: "jan.schmidt@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#2196F3",
    initials: "JS",
  },
  {
    id: 11,
    name: "Katharina Wagner",
    email: "kathy.wagner@hotmail.de",
    phone: "+49 1111 11 111 1",
    color: "#4CAF50",
    initials: "KW",
  },
  {
    id: 12,
    name: "Lars Becker",
    email: "becker.lars@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#00BCD4",
    initials: "LB",
  },
  {
    id: 13,
    name: "Monika Hoffmann",
    email: "m.hoffmann@gmx.de",
    phone: "+49 1111 11 111 1",
    color: "#9C27B0",
    initials: "MH",
  },
  {
    id: 14,
    name: "Petra Klein",
    email: "klein.p@yahoo.com",
    phone: "+49 1111 11 111 1",
    color: "#FFEB3B",
    initials: "PK",
  },
  {
    id: 15,
    name: "Ulrich Fuchs",
    email: "u.fuchs@gmail.com",
    phone: "+49 1111 11 111 1",
    color: "#607D8B",
    initials: "UF",
  },
];

/**
 * List of pre-defined sample tasks loaded for guest users.
 * @type {Array<{id: number, title: string, description: string, dueDate: string, priority: string, assignedTo: string[], subtasks: Array<{id: number, text: string, completed: boolean}>, status: string, createdAt: string, createdBy: string}>}
 */
const DEFAULT_TASKS = [
  {
    id: 101,
    title: "Setup Project Environment",
    description: "Install dependencies, Setup Firebase, Configure Vite",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "urgent",
    assignedTo: ["1"],
    subtasks: [
      { id: 1011, text: "Install dependencies", completed: true },
      { id: 1012, text: "Setup Firebase", completed: true },
      { id: 1013, text: "Configure Vite", completed: true },
    ],
    status: "done",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: 102,
    title: "Implement User Authentication",
    description: "Login page, Sign up page, Password reset",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    priority: "medium",
    assignedTo: ["2", "3"],
    subtasks: [
      { id: 1021, text: "Sign up page", completed: true },
      { id: 1022, text: "Login page", completed: false },
      { id: 1023, text: "Password reset", completed: false },
    ],
    status: "triage",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: 103,
    title: "Enhance Board Drag & Drop",
    description: "Mobile touch support, Smooth animations",
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split("T")[0],
    priority: "urgent",
    assignedTo: ["4"],
    subtasks: [
      { id: 1031, text: "Mobile touch support", completed: false },
      { id: 1032, text: "Smooth animations", completed: false },
    ],
    status: "inprogress",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: 104,
    title: "Design Responsive UI",
    description: "Desktop first, Tablet view, Smartphone portrait",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    priority: "low",
    assignedTo: ["5"],
    subtasks: [
      { id: 1041, text: "Tablet view", completed: true },
      { id: 1042, text: "Smartphone portrait", completed: true },
    ],
    status: "awaitfeedback",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
  {
    id: 105,
    title: "Contact Management Refactoring",
    description: "Optimize Firestore queries, Add search functionality",
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    priority: "medium",
    assignedTo: ["1", "6"],
    subtasks: [
      { id: 1051, text: "Optimize Firestore queries", completed: false },
      { id: 1052, text: "Add search functionality", completed: false },
    ],
    status: "triage",
    createdAt: new Date().toISOString(),
    createdBy: "system",
  },
];
