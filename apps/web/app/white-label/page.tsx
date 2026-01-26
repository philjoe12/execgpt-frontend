import { redirect } from 'next/navigation';

export default function WhiteLabelRedirectPage() {
  redirect('/home/settings');
}
