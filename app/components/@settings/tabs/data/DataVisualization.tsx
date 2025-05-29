import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import type { Chat } from '~/lib/persistence/chats';
import { classNames } from '~/utils/classNames';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// Types for token usage tracking
interface TokenUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

interface TokenStats {
  totalTokens: number;
  averageTokensPerMessage: number;
  tokensByDate: Record<string, TokenUsage>;
  tokensByProvider: Record<string, TokenUsage>;
  tokensByModel: Record<string, TokenUsage>;
  costEstimation: Record<string, number>;
}

// Estimated costs per 1K tokens (in USD) - approximate values
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'OpenAI': { input: 0.0015, output: 0.002 },
  'Anthropic': { input: 0.003, output: 0.015 },
  'Google': { input: 0.00125, output: 0.00375 },
  'Groq': { input: 0.0002, output: 0.0002 },
  'Mistral': { input: 0.0007, output: 0.0007 },
  'Cohere': { input: 0.0015, output: 0.002 },
  'Together': { input: 0.0002, output: 0.0002 },
  'Perplexity': { input: 0.001, output: 0.001 },
  'HuggingFace': { input: 0.0005, output: 0.0005 },
  'Deepseek': { input: 0.00014, output: 0.00028 },
  'xAI': { input: 0.005, output: 0.015 },
  'unknown': { input: 0.001, output: 0.001 },
};

type DataVisualizationProps = {
  chats: Chat[];
};

export function DataVisualization({ chats }: DataVisualizationProps) {
  const [chatsByDate, setChatsByDate] = useState<Record<string, number>>({});
  const [messagesByRole, setMessagesByRole] = useState<Record<string, number>>({});
  const [apiKeyUsage, setApiKeyUsage] = useState<Array<{ provider: string; count: number }>>([]);
  const [averageMessagesPerChat, setAverageMessagesPerChat] = useState<number>(0);
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    totalTokens: 0,
    averageTokensPerMessage: 0,
    tokensByDate: {},
    tokensByProvider: {},
    tokensByModel: {},
    costEstimation: {},
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'tokens' | 'costs'>('overview');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chats || chats.length === 0) {
      return;
    }

    // Process chat data
    const chatDates: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    const apiUsage: Record<string, number> = {};
    let totalMessages = 0;

    // Token usage tracking
    const tokensByDate: Record<string, TokenUsage> = {};
    const tokensByProvider: Record<string, TokenUsage> = {};
    const tokensByModel: Record<string, TokenUsage> = {};
    const costEstimation: Record<string, number> = {};
    let totalTokensUsed = 0;
    let messagesWithTokens = 0;

    chats.forEach((chat) => {
      const date = new Date(chat.timestamp).toLocaleDateString();
      chatDates[date] = (chatDates[date] || 0) + 1;

      chat.messages.forEach((message) => {
        roleCounts[message.role] = (roleCounts[message.role] || 0) + 1;
        totalMessages++;

        if (message.role === 'assistant') {
          const providerMatch = message.content.match(/provider:\s*([\w-]+)/i);
          const provider = providerMatch ? providerMatch[1] : 'unknown';
          apiUsage[provider] = (apiUsage[provider] || 0) + 1;

          // Extract token usage from message annotations
          const annotations = (message as any).annotations || [];
          const usageAnnotation = annotations.find((ann: any) => ann.type === 'usage');
          
          if (usageAnnotation && usageAnnotation.value) {
            const usage = usageAnnotation.value as TokenUsage;
            messagesWithTokens++;
            totalTokensUsed += usage.totalTokens;

            // Track by date
            if (!tokensByDate[date]) {
              tokensByDate[date] = { completionTokens: 0, promptTokens: 0, totalTokens: 0 };
            }
            tokensByDate[date].completionTokens += usage.completionTokens;
            tokensByDate[date].promptTokens += usage.promptTokens;
            tokensByDate[date].totalTokens += usage.totalTokens;

            // Track by provider
            if (!tokensByProvider[provider]) {
              tokensByProvider[provider] = { completionTokens: 0, promptTokens: 0, totalTokens: 0 };
            }
            tokensByProvider[provider].completionTokens += usage.completionTokens;
            tokensByProvider[provider].promptTokens += usage.promptTokens;
            tokensByProvider[provider].totalTokens += usage.totalTokens;

            // Estimate costs
            const costs = TOKEN_COSTS[provider] || TOKEN_COSTS['unknown'];
            const inputCost = (usage.promptTokens / 1000) * costs.input;
            const outputCost = (usage.completionTokens / 1000) * costs.output;
            costEstimation[provider] = (costEstimation[provider] || 0) + inputCost + outputCost;
          }
        }
      });
    });

    const sortedDates = Object.keys(chatDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const sortedChatsByDate: Record<string, number> = {};
    sortedDates.forEach((date) => {
      sortedChatsByDate[date] = chatDates[date];
    });

    setChatsByDate(sortedChatsByDate);
    setMessagesByRole(roleCounts);
    setApiKeyUsage(Object.entries(apiUsage).map(([provider, count]) => ({ provider, count })));
    setAverageMessagesPerChat(totalMessages / chats.length);
    
    setTokenStats({
      totalTokens: totalTokensUsed,
      averageTokensPerMessage: messagesWithTokens > 0 ? totalTokensUsed / messagesWithTokens : 0,
      tokensByDate,
      tokensByProvider,
      tokensByModel,
      costEstimation,
    });
  }, [chats]);

  // Get theme colors from CSS variables to ensure theme consistency
  const getThemeColor = (varName: string): string => {
    // Get the CSS variable value from document root
    if (typeof document !== 'undefined') {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    // Fallback for SSR
    return isDarkMode ? '#FFFFFF' : '#000000';
  };

  // Theme-aware chart colors with enhanced dark mode visibility using CSS variables
  const chartColors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    text: getThemeColor('--bolt-elements-textPrimary'),
    textSecondary: getThemeColor('--bolt-elements-textSecondary'),
    background: getThemeColor('--bolt-elements-bg-depth-1'),
    accent: getThemeColor('--bolt-elements-button-primary-text'),
    border: getThemeColor('--bolt-elements-borderColor'),
  };

  const getChartColors = (index: number) => {
    // Define color palettes based on Bolt design tokens
    const baseColors = [
      // Indigo
      {
        base: getThemeColor('--bolt-elements-button-primary-text'),
      },

      // Pink
      {
        base: isDarkMode ? 'rgb(244, 114, 182)' : 'rgb(236, 72, 153)',
      },

      // Green
      {
        base: getThemeColor('--bolt-elements-icon-success'),
      },

      // Yellow
      {
        base: isDarkMode ? 'rgb(250, 204, 21)' : 'rgb(234, 179, 8)',
      },

      // Blue
      {
        base: isDarkMode ? 'rgb(56, 189, 248)' : 'rgb(14, 165, 233)',
      },
    ];

    // Get the base color for this index
    const color = baseColors[index % baseColors.length].base;

    // Parse color and generate variations with appropriate opacity
    let r = 0,
      g = 0,
      b = 0;

    // Handle rgb/rgba format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);

    if (rgbMatch) {
      [, r, g, b] = rgbMatch.map(Number);
    } else if (rgbaMatch) {
      [, r, g, b] = rgbaMatch.map(Number);
    } else if (color.startsWith('#')) {
      // Handle hex format
      const hex = color.slice(1);
      const bigint = parseInt(hex, 16);
      r = (bigint >> 16) & 255;
      g = (bigint >> 8) & 255;
      b = bigint & 255;
    }

    return {
      bg: `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.7 : 0.5})`,
      border: `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.9 : 0.8})`,
    };
  };

  const chartData = {
    history: {
      labels: Object.keys(chatsByDate),
      datasets: [
        {
          label: 'Conversations Créées',
          data: Object.values(chatsByDate),
          backgroundColor: getChartColors(0).bg,
          borderColor: getChartColors(0).border,
          borderWidth: 1,
        },
      ],
    },
    roles: {
      labels: Object.keys(messagesByRole).map(role => {
        const roleTranslations: Record<string, string> = {
          'user': 'Utilisateur',
          'assistant': 'Assistant',
          'system': 'Système'
        };
        return roleTranslations[role] || role;
      }),
      datasets: [
        {
          label: 'Messages par Rôle',
          data: Object.values(messagesByRole),
          backgroundColor: Object.keys(messagesByRole).map((_, i) => getChartColors(i).bg),
          borderColor: Object.keys(messagesByRole).map((_, i) => getChartColors(i).border),
          borderWidth: 1,
        },
      ],
    },
    apiUsage: {
      labels: apiKeyUsage.map((item) => item.provider),
      datasets: [
        {
          label: 'Utilisation API',
          data: apiKeyUsage.map((item) => item.count),
          backgroundColor: apiKeyUsage.map((_, i) => getChartColors(i).bg),
          borderColor: apiKeyUsage.map((_, i) => getChartColors(i).border),
          borderWidth: 1,
        },
      ],
    },
    tokensByDate: {
      labels: Object.keys(tokenStats.tokensByDate),
      datasets: [
        {
          label: 'Tokens de Prompt',
          data: Object.values(tokenStats.tokensByDate).map(usage => usage.promptTokens),
          backgroundColor: getChartColors(0).bg,
          borderColor: getChartColors(0).border,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Tokens de Complétion',
          data: Object.values(tokenStats.tokensByDate).map(usage => usage.completionTokens),
          backgroundColor: getChartColors(1).bg,
          borderColor: getChartColors(1).border,
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    tokensByProvider: {
      labels: Object.keys(tokenStats.tokensByProvider),
      datasets: [
        {
          label: 'Total des Tokens',
          data: Object.values(tokenStats.tokensByProvider).map(usage => usage.totalTokens),
          backgroundColor: Object.keys(tokenStats.tokensByProvider).map((_, i) => getChartColors(i).bg),
          borderColor: Object.keys(tokenStats.tokensByProvider).map((_, i) => getChartColors(i).border),
          borderWidth: 1,
        },
      ],
    },
    costsByProvider: {
      labels: Object.keys(tokenStats.costEstimation),
      datasets: [
        {
          label: 'Coût Estimé (USD)',
          data: Object.values(tokenStats.costEstimation),
          backgroundColor: Object.keys(tokenStats.costEstimation).map((_, i) => getChartColors(i).bg),
          borderColor: Object.keys(tokenStats.costEstimation).map((_, i) => getChartColors(i).border),
          borderWidth: 1,
        },
      ],
    },
  };

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    color: chartColors.text,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartColors.text,
          font: {
            weight: 'bold' as const,
            size: 12,
          },
          padding: 16,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        color: chartColors.text,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 16,
      },
      tooltip: {
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        backgroundColor: isDarkMode
          ? 'rgba(23, 23, 23, 0.8)' // Dark bg using Tailwind gray-900
          : 'rgba(255, 255, 255, 0.8)', // Light bg
        borderColor: chartColors.border,
        borderWidth: 1,
      },
    },
  };

  const chartOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        ...baseChartOptions.plugins.title,
        text: 'Historique des Conversations',
      },
    },
    scales: {
      x: {
        grid: {
          color: chartColors.grid,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: chartColors.text,
          font: {
            weight: 500,
          },
        },
      },
      y: {
        grid: {
          color: chartColors.grid,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: chartColors.text,
          font: {
            weight: 500,
          },
        },
      },
    },
  };

  const pieOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        ...baseChartOptions.plugins.title,
        text: 'Distribution des Messages',
      },
      legend: {
        ...baseChartOptions.plugins.legend,
        position: 'right' as const,
      },
      datalabels: {
        color: chartColors.text,
        font: {
          weight: 'bold' as const,
        },
      },
    },
  };

  if (chats.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="i-ph-chart-line-duotone w-12 h-12 mx-auto mb-4 text-bolt-elements-textTertiary opacity-80" />
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Aucune Donnée Disponible</h3>
        <p className="text-bolt-elements-textSecondary">
          Commencez à créer des conversations pour voir vos statistiques d'utilisation et la visualisation des données.
        </p>
      </div>
    );
  }

  const cardClasses = classNames(
    'p-6 rounded-lg shadow-sm',
    'bg-bolt-elements-bg-depth-1',
    'border border-bolt-elements-borderColor',
  );

  const statClasses = classNames('text-3xl font-bold text-bolt-elements-textPrimary', 'flex items-center gap-3');

  const renderOverviewTab = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Total Conversations</h3>
          <div className={statClasses}>
            <div className="i-ph-chats-duotone w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            <span>{chats.length}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Total Messages</h3>
          <div className={statClasses}>
            <div className="i-ph-chat-text-duotone w-8 h-8 text-pink-500 dark:text-pink-400" />
            <span>{Object.values(messagesByRole).reduce((sum, count) => sum + count, 0)}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Total Tokens</h3>
          <div className={statClasses}>
            <div className="i-ph-cpu-duotone w-8 h-8 text-blue-500 dark:text-blue-400" />
            <span>{tokenStats.totalTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Moy. Messages/Conv.</h3>
          <div className={statClasses}>
            <div className="i-ph-chart-bar-duotone w-8 h-8 text-green-500 dark:text-green-400" />
            <span>{averageMessagesPerChat.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Historique des Conversations</h3>
          <div className="h-64">
            <Bar data={chartData.history} options={chartOptions} />
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Distribution des Messages</h3>
          <div className="h-64">
            <Pie data={chartData.roles} options={pieOptions} />
          </div>
        </div>
      </div>

      {apiKeyUsage.length > 0 && (
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Utilisation API par Fournisseur</h3>
          <div className="h-64">
            <Pie data={chartData.apiUsage} options={pieOptions} />
          </div>
        </div>
      )}
    </div>
  );

  const renderTokensTab = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Tokens Utilisés</h3>
          <div className={statClasses}>
            <div className="i-ph-cpu-duotone w-8 h-8 text-blue-500 dark:text-blue-400" />
            <span>{tokenStats.totalTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Moy. Tokens/Message</h3>
          <div className={statClasses}>
            <div className="i-ph-chart-line-duotone w-8 h-8 text-purple-500 dark:text-purple-400" />
            <span>{Math.round(tokenStats.averageTokensPerMessage)}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Fournisseurs Actifs</h3>
          <div className={statClasses}>
            <div className="i-ph-plugs-connected-duotone w-8 h-8 text-orange-500 dark:text-orange-400" />
            <span>{Object.keys(tokenStats.tokensByProvider).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Évolution des Tokens</h3>
          <div className="h-64">
            <Line data={chartData.tokensByDate} options={{
              ...baseChartOptions,
              plugins: {
                ...baseChartOptions.plugins,
                title: {
                  ...baseChartOptions.plugins.title,
                  text: 'Chronologie de Consommation des Tokens',
                },
              },
              scales: {
                x: {
                  grid: { color: chartColors.grid, display: false },
                  border: { display: false },
                  ticks: { color: chartColors.text, font: { weight: 500 } },
                },
                y: {
                  grid: { color: chartColors.grid, display: false },
                  border: { display: false },
                  ticks: { color: chartColors.text, font: { weight: 500 } },
                },
              },
            }} />
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Tokens par Fournisseur</h3>
          <div className="h-64">
            <Pie data={chartData.tokensByProvider} options={{
              ...pieOptions,
              plugins: {
                ...pieOptions.plugins,
                title: {
                  ...pieOptions.plugins.title,
                  text: 'Distribution des Tokens par Fournisseur',
                },
              },
            }} />
          </div>
        </div>
      </div>

      {Object.keys(tokenStats.tokensByProvider).length > 0 && (
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Détail des Tokens</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bolt-elements-borderColor">
                  <th className="text-left py-3 px-4 font-medium text-bolt-elements-textPrimary">Fournisseur</th>
                  <th className="text-right py-3 px-4 font-medium text-bolt-elements-textPrimary">Tokens Prompt</th>
                  <th className="text-right py-3 px-4 font-medium text-bolt-elements-textPrimary">Tokens Complétion</th>
                  <th className="text-right py-3 px-4 font-medium text-bolt-elements-textPrimary">Total Tokens</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tokenStats.tokensByProvider).map(([provider, usage]) => (
                  <tr key={provider} className="border-b border-bolt-elements-borderColor/50">
                    <td className="py-3 px-4 text-bolt-elements-textPrimary font-medium">{provider}</td>
                    <td className="py-3 px-4 text-right text-bolt-elements-textSecondary">{usage.promptTokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-bolt-elements-textSecondary">{usage.completionTokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-bolt-elements-textPrimary font-medium">{usage.totalTokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCostsTab = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Coût Total Estimé</h3>
          <div className={statClasses}>
            <div className="i-ph-currency-dollar-duotone w-8 h-8 text-green-500 dark:text-green-400" />
            <span>${Object.values(tokenStats.costEstimation).reduce((sum, cost) => sum + cost, 0).toFixed(4)}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Coût Moy./Message</h3>
          <div className={statClasses}>
            <div className="i-ph-calculator-duotone w-8 h-8 text-blue-500 dark:text-blue-400" />
            <span>${(Object.values(tokenStats.costEstimation).reduce((sum, cost) => sum + cost, 0) / Math.max(Object.values(messagesByRole).reduce((sum, count) => sum + count, 0), 1)).toFixed(6)}</span>
          </div>
        </div>

        <div className={cardClasses}>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Fournisseur le Plus Cher</h3>
          <div className={statClasses}>
            <div className="i-ph-trend-up-duotone w-8 h-8 text-red-500 dark:text-red-400" />
            <span>{Object.entries(tokenStats.costEstimation).reduce((max, [provider, cost]) => cost > max.cost ? { provider, cost } : max, { provider: 'N/A', cost: 0 }).provider}</span>
          </div>
        </div>
      </div>

      {Object.keys(tokenStats.costEstimation).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cardClasses}>
             <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Répartition des Coûts par Fournisseur</h3>
            <div className="h-64">
              <Pie data={chartData.costsByProvider} options={{
                ...pieOptions,
                plugins: {
                  ...pieOptions.plugins,
                  title: {
                     ...pieOptions.plugins.title,
                     text: 'Coûts Estimés par Fournisseur',
                   },
                  tooltip: {
                    ...pieOptions.plugins.tooltip,
                    callbacks: {
                      label: (context: any) => {
                        const label = context.label || '';
                        const value = context.parsed;
                        return `${label}: $${value.toFixed(4)}`;
                      },
                    },
                  },
                },
              }} />
            </div>
          </div>

          <div className={cardClasses}>
             <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-6">Détail des Coûts</h3>
            <div className="space-y-4">
              {Object.entries(tokenStats.costEstimation)
                .sort(([,a], [,b]) => b - a)
                .map(([provider, cost]) => {
                  const usage = tokenStats.tokensByProvider[provider];
                  const costs = TOKEN_COSTS[provider] || TOKEN_COSTS['unknown'];
                  return (
                    <div key={provider} className="flex items-center justify-between p-4 bg-bolt-elements-bg-depth-2 rounded-lg">
                      <div>
                        <div className="font-medium text-bolt-elements-textPrimary">{provider}</div>
                        <div className="text-sm text-bolt-elements-textSecondary">
                          {usage?.totalTokens.toLocaleString()} tokens • ${costs.input.toFixed(4)}/1K input • ${costs.output.toFixed(4)}/1K output
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-bolt-elements-textPrimary">${cost.toFixed(4)}</div>
                        <div className="text-sm text-bolt-elements-textSecondary">
                          {((cost / Object.values(tokenStats.costEstimation).reduce((sum, c) => sum + c, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <div className={cardClasses}>
         <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Conseils d'Optimisation des Coûts</h3>
         <div className="space-y-3 text-sm text-bolt-elements-textSecondary">
           <div className="flex items-start gap-3">
             <div className="i-ph-lightbulb-duotone w-5 h-5 text-yellow-500 mt-0.5" />
             <div>
               <strong>Utilisez des modèles efficaces :</strong> Considérez l'utilisation de modèles plus petits comme GPT-4o Mini ou Claude Haiku pour les tâches simples afin de réduire les coûts.
             </div>
           </div>
           <div className="flex items-start gap-3">
             <div className="i-ph-scissors-duotone w-5 h-5 text-blue-500 mt-0.5" />
             <div>
               <strong>Optimisez vos prompts :</strong> Rédigez des prompts concis et clairs pour minimiser l'utilisation de tokens tout en maintenant la qualité.
             </div>
           </div>
           <div className="flex items-start gap-3">
             <div className="i-ph-chart-line-down-duotone w-5 h-5 text-green-500 mt-0.5" />
             <div>
               <strong>Surveillez l'utilisation :</strong> Examinez régulièrement vos patterns de consommation de tokens pour identifier les opportunités d'optimisation.
             </div>
           </div>
         </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-bolt-elements-bg-depth-2 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: 'i-ph-chart-pie-duotone' },
          { id: 'tokens', label: 'Analyse des Tokens', icon: 'i-ph-cpu-duotone' },
          { id: 'costs', label: 'Estimation des Coûts', icon: 'i-ph-currency-dollar-duotone' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={classNames(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedView === tab.id
                ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-depth-1'
            )}
          >
            <div className={`${tab.icon} w-4 h-4`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedView === 'overview' && renderOverviewTab()}
      {selectedView === 'tokens' && renderTokensTab()}
      {selectedView === 'costs' && renderCostsTab()}
    </div>
  );
}
