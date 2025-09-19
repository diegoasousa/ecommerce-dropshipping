import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const options: StrategyOptions = {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3001/auth/google/callback',
      scope: ['profile', 'email'],
    };
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    return {
      provider: 'google',
      id: profile.id,
      email: profile.emails?.[0].value,
      name: profile.displayName,
      avatar: profile.photos?.[0].value,
    };
  }
}