import { Avatar as BaseAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";

export default function Avatar() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Get the latest user data from the cache
  const userData = queryClient.getQueryData(["/api/user"]);
  const avatarUrl = userData?.avatarUrl || user?.avatarUrl;

  return (
    <BaseAvatar className="h-16 w-16 border-2 border-primary">
      <AvatarImage 
        src={avatarUrl} 
        alt={user?.username}
        className="object-cover"
      />
      <AvatarFallback className="bg-primary text-black">
        {user?.username?.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </BaseAvatar>
  );
}