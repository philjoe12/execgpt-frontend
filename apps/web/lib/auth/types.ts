export type ExecgptUser = {
  id: string;
  email: string;
  username?: string | null;
  role?: string | null;
  organization?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
    isAgency?: boolean | null;
  } | null;
  tenant?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    status?: string | null;
    tenant_type?: string | null;
    custom_domain?: string | null;
  } | null;
};
