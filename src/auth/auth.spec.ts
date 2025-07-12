//this file contains the mock testing of authentication related function to check for their expected outputed results, the auth service will contain 3 functionalities for testing which will include token generation function, hash password and verify password. There was supposed to be another functionality called token verification but it was intigration tested on an API.
import { Users } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

const prisma: PrismaService = new PrismaService();

const authService = new AuthService(prisma);

// unit testing of the create token function by creating a test user
test('Will generate a long unique hash as the token from the user id.', async () => {
  const mockUser: Users = await prisma.users.create({
    data: {
      firstName: 'Test',
      lastName: 'User',
      userName: 'test_user',
      email: 'testuser@email.com',
      password: 'testuserpassword',
    },
  });

  const generatedToken: string = await authService.generateToken(mockUser.id);

  await prisma.sessions.deleteMany({
    where: {
      userId: mockUser.id,
    },
  });

  await prisma.users.delete({
    where: {
      id: mockUser.id,
    },
  });

  expect(generatedToken).toMatch(
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  );
});

// variables for the password testing functions
const testPassword: string = 'testuserpassword';
let hashedTestPassword: string;

(async () => {
  hashedTestPassword = await authService.hashPassword(testPassword);
})();

// unit testing of the create hashed password by providing the raw password
test('Will generate a long unique hashed password from the raw password.', async () => {
  const hashedPassword: string = await authService.hashPassword(testPassword);

  expect(hashedPassword).toMatch(/^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/);
});

// unit testing of the verify hashed password by providing both the raw password and the hashed password
test("Will verify a long unique hashed password and it's raw password if they match.", async () => {
  const verifyHashedPassword: boolean = await authService.verifyPassword(
    testPassword,
    hashedTestPassword,
  );

  expect(verifyHashedPassword).toBe(true);
});
