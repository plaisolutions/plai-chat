import { Skeleton } from "@/components/ui/skeleton"

export default function ChatSkeleton() {
  return (
    <div className="grid h-screen grid-cols-1 gap-4 p-8 md:grid-cols-12">
      <div className="col-span-12 md:col-span-3">
        <Skeleton className="my-4 h-10 w-full" />
        <Skeleton className="my-4 h-72 w-full" />
      </div>
      <div className="col-span-12 md:col-span-9">
        <Skeleton className="my-4 h-10 w-full" />
        <Skeleton className="my-4 h-96 w-full" />
      </div>
    </div>
  )
}
