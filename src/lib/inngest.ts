import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({ 
  id: 'media-manager',
  name: 'Media Manager'
});

// Type definitions for our events
export type Events = {
  'media/process': {
    data: {
      mediaId: string;
      originalUrl: string;
      filename: string;
      mimetype: string;
    };
  };
  'media/analyze': {
    data: {
      mediaId: string;
      originalUrl: string;
    };
  };
}; 