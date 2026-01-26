import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';
import { getServerAuthUser } from '~/lib/auth/server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { getPublicTenantContext } from '~/lib/tenant/get-public-tenant-context';

async function SiteLayout(props: React.PropsWithChildren) {
  const user = await getServerAuthUser();
  const tenantContext = await getPublicTenantContext();
  const brandingLogo =
    (tenantContext?.branding as { logo_url?: string | null } | undefined)?.logo_url;
  const logoSrc = brandingLogo || tenantContext?.branding_logo_url || undefined;

  return (
    <div className={'flex min-h-[100vh] flex-col'}>
      <SiteHeader user={user} logoSrc={logoSrc} />

      {props.children}

      <SiteFooter logoSrc={logoSrc} />
    </div>
  );
}

export default withI18n(SiteLayout);
