import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ToolResultSheetProps {
  title: string
  contentTitle?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export function ToolResultSheet({
  children,
  title,
  contentTitle,
  icon,
}: ToolResultSheetProps) {
  // Use contentTitle if provided, otherwise fall back to title
  const finalContentTitle = contentTitle || title
  
  return (
    <Sheet>
      <SheetTrigger>
        <Trigger title={title} icon={icon} />
      </SheetTrigger>
      <SheetContent className="top-20 overflow-y-auto pb-20 md:top-0 md:pb-0">
        <SheetHeader>
          <SheetTitle className="mb-3">{finalContentTitle}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}

function Trigger({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex h-full flex-row items-end gap-2 rounded-md bg-stone-50 p-4 hover:cursor-pointer hover:bg-slate-100">
      <p className="text-sm font-medium">{title}</p>
      {icon && <div className="size-5">{icon}</div>}
    </div>
  )
}
