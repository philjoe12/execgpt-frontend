import { NextRequest, NextResponse } from 'next/server';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL(pathsConfig.auth.signIn, request.nextUrl.origin),
  );
}
