import { createServer } from 'http';
import { createHmac } from 'crypto';
import { XPCalculator } from '../core/xp-calculator';

export class GitHubWebhookHandler {
  private secret: string;
  private xpCalculator: XPCalculator;

  constructor(secret: string, xpCalculator: XPCalculator) {
    this.secret = secret;
    this.xpCalculator = xpCalculator;
  }

  /**
   * Create webhook server
   */
  createServer(port: number) {
    return createServer((req, res) => {
      let data = '';

      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', async () => {
        // Verify signature
        const signature = this.verifySignature(data, req.headers['x-hub-signature'] as string);

        if (!signature) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        const event = JSON.parse(data);
        const eventType = req.headers['x-github-event'] as string;

        try {
          await this.handleEvent(eventType, event);
          res.writeHead(200);
          res.end('OK');
        } catch (error) {
          console.error('Webhook error:', error);
          res.writeHead(500);
          res.end('Error');
        }
      });
    }).listen(port);
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: string, signature: string): boolean {
    const hash = createHmac('sha1', this.secret)
      .update(payload)
      .digest('hex');

    return `sha1=${hash}` === signature;
  }

  /**
   * Handle different GitHub events
   */
  private async handleEvent(eventType: string, event: any) {
    const userId = event.sender?.login;

    if (!userId) return;

    switch (eventType) {
      case 'push':
        // Award XP for each commit (max 100 XP/day)
        const commits = event.commits || [];
        for (const commit of commits) {
          await this.xpCalculator.addXP(userId, 'CODE_COMMIT', {
            sha: commit.id,
            message: commit.message,
            timestamp: commit.timestamp,
          });
        }
        break;

      case 'pull_request':
        if (event.action === 'closed' && event.pull_request.merged) {
          await this.xpCalculator.addXP(userId, 'PR_MERGED', {
            prNumber: event.number,
            title: event.pull_request.title,
          });
        }
        break;

      case 'issues':
        if (event.action === 'closed') {
          await this.xpCalculator.addXP(userId, 'ISSUE_RESOLVED', {
            issueNumber: event.issue.number,
            title: event.issue.title,
          });
        }
        break;

      case 'pull_request_review':
        // Award XP for PR reviews (tracked via comment count)
        // Implementation would count reviews per day
        break;
    }
  }
}
