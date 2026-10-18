import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting Komnottra database to Clean Slate (0 receipts)...');

  // 1. Clean all existing records
  await prisma.receipt.deleteMany();
  await prisma.workspaceColumn.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const defaultPasswordHash = bcrypt.hashSync('komnottra2026', 10);

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: '68ab6eec-164b-4033-9d2b-6874c66b49ee',
      name: 'Komnottra · កំណត់ត្រា',
      ownerId: '95189b46-b333-47e6-a235-51790a691e3d',
      baseCurrency: 'KHR',
      exchangeRate: 4000.0,
      rateMode: 'NBC_AUTO',
      flagMissingTin: true,
      inviteCode: 'KOM-7850',
      departments: JSON.stringify(['Administration', 'Sales', 'Engineering', 'Operations']),
      expenseCodes: JSON.stringify(['Meals', 'Transport', 'Office supplies', 'Utilities', 'Other']),
      projects: JSON.stringify(['GA-2026 General admin', 'TRN-09 Staff training', 'BD-2026 Business dev.']),
    },
  });

  // 3. Create Default Workspace Columns
  const defaultColumns = [
    { key: 'date', label: 'Date', isVisible: true, isRequired: true, order: 1 },
    { key: 'receiptNo', label: 'Receipt no.', isVisible: true, isRequired: true, order: 2 },
    { key: 'payee', label: 'Payee', isVisible: true, isRequired: true, order: 3 },
    { key: 'vendorTin', label: 'Vendor TIN', isVisible: true, isRequired: false, order: 4 },
    { key: 'description', label: 'Description', isVisible: true, isRequired: true, order: 5 },
    { key: 'claimant', label: 'Claimant', isVisible: true, isRequired: true, order: 6 },
    { key: 'department', label: 'Department', isVisible: true, isRequired: true, order: 7 },
    { key: 'project', label: 'Project / budget line', isVisible: true, isRequired: false, order: 8 },
    { key: 'expenseCode', label: 'Expense code', isVisible: true, isRequired: true, order: 9 },
    { key: 'paymentMethod', label: 'Payment method', isVisible: true, isRequired: false, order: 10 },
    { key: 'currency', label: 'Currency', isVisible: true, isRequired: true, order: 11 },
    { key: 'rate', label: 'Rate', isVisible: true, isRequired: true, order: 12 },
    { key: 'amountExclVat', label: 'Amount excl. VAT', isVisible: true, isRequired: true, order: 13 },
    { key: 'vat', label: 'VAT', isVisible: true, isRequired: true, order: 14 },
    { key: 'total', label: 'Total', isVisible: true, isRequired: true, order: 15 },
    { key: 'totalBaseEquiv', label: 'Total (KHR equiv.)', isVisible: true, isRequired: true, order: 16 },
    { key: 'status', label: 'Status', isVisible: true, isRequired: true, order: 17 },
    { key: 'approvedBy', label: 'Approved by', isVisible: true, isRequired: false, order: 18 },
  ];

  for (const col of defaultColumns) {
    await prisma.workspaceColumn.create({
      data: {
        workspaceId: workspace.id,
        key: col.key,
        label: col.label,
        isVisible: col.isVisible,
        isRequired: col.isRequired,
        order: col.order,
      },
    });
  }

  // 4. Create Users (Owner & Team Staff)
  const owner = await prisma.user.create({
    data: {
      id: '95189b46-b333-47e6-a235-51790a691e3d',
      email: 'sokseyhaboth09@gmail.com',
      passwordHash: defaultPasswordHash,
      name: 'Seyhaboth Sok',
      department: 'Administration',
      role: 'OWNER',
      workspaceId: workspace.id,
    },
  });

  // Demo account for judges/testing
  await prisma.user.create({
    data: {
      email: 'sokha@company.com',
      passwordHash: defaultPasswordHash,
      name: 'Sokha Chea',
      department: 'Administration',
      role: 'OWNER',
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'channary.lim@company.com',
      passwordHash: defaultPasswordHash,
      name: 'Channary Lim',
      department: 'Administration',
      role: 'MEMBER',
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'dara.kim@company.com',
      passwordHash: defaultPasswordHash,
      name: 'Dara Kim',
      department: 'Sales',
      role: 'MEMBER',
      workspaceId: workspace.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'vannak.sok@company.com',
      passwordHash: defaultPasswordHash,
      name: 'Vannak Sok',
      department: 'Operations',
      role: 'MEMBER',
      workspaceId: workspace.id,
    },
  });

  console.log(`✅ Database successfully reset to Clean Slate!`);
  console.log(`👤 Owner: Seyhaboth Sok (sokseyhaboth09@gmail.com)`);
  console.log(`🏢 Workspace: Komnottra · កំណត់ត្រា (Invite Code: KOM-7850)`);
  console.log(`🧾 Receipts: 0 (Ready for fresh scanning & review)`);
}

main()
  .catch((e) => {
    console.error('Reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
