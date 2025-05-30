import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getUnlimited(): string {
    return "Unlimited! let's go!";
  }

  getLimited(): string {
    return `Limited, don't over use me!`;
  }
}
