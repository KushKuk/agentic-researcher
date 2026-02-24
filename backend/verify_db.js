import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'e2e_final_test@example.com' },
        include: {
            profile: true,
            preferences: true
        }
    });

    console.log("=== DB RECORD ===");
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
