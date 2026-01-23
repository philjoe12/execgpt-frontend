import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  void request;
  return redirect(pathsConfig.auth.signIn);
}
