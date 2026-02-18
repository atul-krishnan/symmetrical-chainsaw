import { redirect } from "next/navigation";

export default async function ProductRootPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  if (params.org) {
    redirect(`/product/admin/dashboard?org=${params.org}`);
  }

  redirect("/product/admin/dashboard");
}
