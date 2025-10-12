import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const u1 = await prisma.user.create({ data: { name: 'Alex Johnson', email: 'alex@example.com', password: 'changeme', title: 'Software Engineer', avatar: null } });
  const u2 = await prisma.user.create({ data: { name: 'Samira Lee', email: 'samira@example.com', password: 'changeme', title: 'Product Designer', avatar: null } });
  const u3 = await prisma.user.create({ data: { name: 'Diego Ramos', email: 'diego@example.com', password: 'changeme', title: 'Photographer', avatar: null } });

  const p1 = await prisma.post.create({ data: { userId: u2.id, content: 'Excited to share the new project I\'m working on!' } });
  await prisma.comment.create({ data: { postId: p1.id, userId: u1.id, text: 'Looks great!' } });

  await prisma.post.create({ data: { userId: u3.id, content: 'Golden hour shots from last weekend.', image: '/file.svg' } });

  // seed some messages for the demo/messages page
  await prisma.message.create({ data: { userId: u1.id, text: 'Hello everyone! This is Alex.' } });
  await prisma.message.create({ data: { userId: u2.id, text: 'Hi Alex — loving the new layout.' } });
  await prisma.message.create({ data: { userId: u3.id, text: 'Anyone up for a photo walk this weekend?' } });

  console.log('Seed finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
