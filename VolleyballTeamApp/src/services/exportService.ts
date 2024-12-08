import RNFS from 'react-native-fs';
import { Platform, Share } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';

type ExportFormat = 'csv' | 'pdf';
type ExportType = 'team' | 'player' | 'match';

type ExportOptions = {
  startDate?: string;
  endDate?: string;
  playerId?: string;
  matchId?: string;
  includeCharts?: boolean;
};

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportData(
    format: ExportFormat,
    type: ExportType,
    options: ExportOptions = {}
  ): Promise<string> {
    try {
      let data: any;
      switch (type) {
        case 'team':
          data = await this.getTeamData(options);
          break;
        case 'player':
          data = await this.getPlayerData(options);
          break;
        case 'match':
          data = await this.getMatchData(options);
          break;
      }

      if (format === 'csv') {
        return await this.generateCSV(data, type);
      } else {
        return await this.generatePDF(data, type, options);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export data');
    }
  }

  private async getTeamData(options: ExportOptions) {
    const query = supabase
      .from(TABLES.MATCH_STATS)
      .select(\`
        matches (
          id,
          date,
          opponent,
          result,
          score
        ),
        players (
          id,
          firstName,
          lastName,
          position,
          jerseyNumber
        ),
        serves,
        aces,
        kills,
        blocks,
        digs,
        assists,
        errors,
        points
      \`);

    if (options.startDate) {
      query.gte('matches.date', options.startDate);
    }
    if (options.endDate) {
      query.lte('matches.date', options.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  private async getPlayerData(options: ExportOptions) {
    if (!options.playerId) throw new Error('Player ID is required');

    const query = supabase
      .from(TABLES.MATCH_STATS)
      .select(\`
        matches (
          id,
          date,
          opponent,
          result,
          score
        ),
        serves,
        aces,
        kills,
        blocks,
        digs,
        assists,
        errors,
        points
      \`)
      .eq('playerId', options.playerId);

    if (options.startDate) {
      query.gte('matches.date', options.startDate);
    }
    if (options.endDate) {
      query.lte('matches.date', options.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  private async getMatchData(options: ExportOptions) {
    if (!options.matchId) throw new Error('Match ID is required');

    const { data, error } = await supabase
      .from(TABLES.MATCH_STATS)
      .select(\`
        matches (
          id,
          date,
          opponent,
          result,
          score,
          location,
          notes
        ),
        players (
          id,
          firstName,
          lastName,
          position,
          jerseyNumber
        ),
        serves,
        aces,
        kills,
        blocks,
        digs,
        assists,
        errors,
        points
      \`)
      .eq('matches.id', options.matchId);

    if (error) throw error;
    return data;
  }

  private async generateCSV(data: any[], type: ExportType): Promise<string> {
    const headers = this.getCSVHeaders(type);
    const rows = data.map(item => this.formatCSVRow(item, type));
    const csvContent = [headers, ...rows].join('\\n');

    const fileName = \`\${type}_stats_\${new Date().toISOString().split('T')[0]}.csv\`;
    const filePath = \`\${RNFS.DocumentDirectoryPath}/\${fileName}\`;

    await RNFS.writeFile(filePath, csvContent, 'utf8');
    return filePath;
  }

  private getCSVHeaders(type: ExportType): string {
    switch (type) {
      case 'team':
        return 'Date,Opponent,Result,Score,Player,Position,Serves,Aces,Kills,Blocks,Digs,Assists,Errors,Points';
      case 'player':
        return 'Date,Opponent,Result,Score,Serves,Aces,Kills,Blocks,Digs,Assists,Errors,Points';
      case 'match':
        return 'Player,Position,Jersey,Serves,Aces,Kills,Blocks,Digs,Assists,Errors,Points';
      default:
        return '';
    }
  }

  private formatCSVRow(item: any, type: ExportType): string {
    switch (type) {
      case 'team':
        return \`\${item.matches.date},\${item.matches.opponent},\${item.matches.result},\${item.matches.score},\${item.players.firstName} \${item.players.lastName},\${item.players.position},\${item.serves},\${item.aces},\${item.kills},\${item.blocks},\${item.digs},\${item.assists},\${item.errors},\${item.points}\`;
      case 'player':
        return \`\${item.matches.date},\${item.matches.opponent},\${item.matches.result},\${item.matches.score},\${item.serves},\${item.aces},\${item.kills},\${item.blocks},\${item.digs},\${item.assists},\${item.errors},\${item.points}\`;
      case 'match':
        return \`\${item.players.firstName} \${item.players.lastName},\${item.players.position},\${item.players.jerseyNumber},\${item.serves},\${item.aces},\${item.kills},\${item.blocks},\${item.digs},\${item.assists},\${item.errors},\${item.points}\`;
      default:
        return '';
    }
  }

  private async generatePDF(data: any[], type: ExportType, options: ExportOptions): Promise<string> {
    const htmlContent = this.generateHTMLContent(data, type, options);
    const fileName = \`\${type}_report_\${new Date().toISOString().split('T')[0]}\`;

    const result = await RNHTMLtoPDF.convert({
      html: htmlContent,
      fileName,
      width: 612, // Standard US Letter width in points
      height: 792, // Standard US Letter height in points
    });

    return result.filePath;
  }

  private generateHTMLContent(data: any[], type: ExportType, options: ExportOptions): string {
    const title = this.getReportTitle(type);
    const content = this.formatHTMLContent(data, type);
    const charts = options.includeCharts ? this.generateChartImages(data, type) : '';

    return \`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 30px; }
            .chart { margin: 20px 0; text-align: center; }
            .summary { margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>\${title}</h1>
            <p>Generated on \${new Date().toLocaleDateString()}</p>
          </div>
          \${content}
          \${charts}
        </body>
      </html>
    \`;
  }

  private getReportTitle(type: ExportType): string {
    switch (type) {
      case 'team':
        return 'Team Performance Report';
      case 'player':
        return 'Player Statistics Report';
      case 'match':
        return 'Match Report';
      default:
        return 'Report';
    }
  }

  private formatHTMLContent(data: any[], type: ExportType): string {
    // Implementation would format data into HTML tables and summaries
    // based on the export type
    return \`<div class="content">...</div>\`;
  }

  private generateChartImages(data: any[], type: ExportType): string {
    // Implementation would generate base64 encoded chart images
    // using a charting library
    return \`<div class="charts">...</div>\`;
  }

  async shareExport(filePath: string) {
    try {
      if (Platform.OS === 'ios') {
        await Share.share({
          url: filePath,
        });
      } else {
        await Share.share({
          title: 'Export Data',
          message: filePath,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      throw new Error('Failed to share export');
    }
  }
}
