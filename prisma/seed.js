import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const u1 = await prisma.user.create({ data: { name: 'Alex Johnson', email: 'alex@example.com', password: 'changeme', title: 'Software Engineer' } });
  const u2 = await prisma.user.create({ data: { name: 'Samira Lee', email: 'samira@example.com', password: 'changeme', title: 'Product Designer' } });
  const u3 = await prisma.user.create({ data: { name: 'Diego Ramos', email: 'diego@example.com', password: 'changeme', title: 'Photographer' } });

  const p1 = await prisma.post.create({ data: { userId: u2.id, content: 'Excited to share the new project I\'m working on!' } });
  await prisma.comment.create({ data: { postId: p1.id, userId: u1.id, text: 'Looks great!' } });

  const p2 = await prisma.post.create({ data: { userId: u3.id, content: 'Golden hour shots from last weekend.', image: '/file.svg' } });

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
