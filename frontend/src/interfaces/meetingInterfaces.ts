interface MeetingPlatform {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingPlatformResponse {
    status: string;
    MeetingPlatforms: MeetingPlatform[];
}
