import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Unauthorized() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unauthorized</CardTitle>
        <CardDescription>
          You don&apos;t have permissions for this action.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
