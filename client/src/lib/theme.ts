import { useQuery } from '@tanstack/react-query';

interface Theme {
  variant: "professional" | "tint" | "vibrant";
  primary: string;
  appearance: "light" | "dark" | "system";
  radius: number;
}

const defaultTheme: Theme = {
  variant: "professional",
  primary: "hsl(39, 100%, 67%)", // Default #FFBD59
  appearance: "light",
  radius: 0.5,
};

export function useTheme() {
  const { data: theme = defaultTheme, isLoading } = useQuery<Theme>({
    queryKey: ['/theme.json'],
    queryFn: async () => {
      try {
        const res = await fetch('/theme.json');
        if (!res.ok) {
          console.warn('Failed to fetch theme, using default');
          return defaultTheme;
        }
        const data = await res.json();
        return data as Theme;
      } catch (error) {
        console.warn('Error fetching theme, using default:', error);
        return defaultTheme;
      }
    },
    staleTime: Infinity,
  });

  return { theme, isLoading };
}

export type { Theme };
