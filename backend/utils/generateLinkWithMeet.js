import { google } from 'googleapis';

const API_PREFIX = process.env.API_PREFIX;

export async function generateLinkWithMeet(startTime, endTime,) {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    const scopes = "https://www.googleapis.com/auth/calendar.events"
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
    });
    console.log("Visita esta URL para autorizar:", authUrl);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const start = startTime
    const end = endTime

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const event = {
        'summary': 'Cita Programada',
        'location': '',
        'start': {
            'dateTime': { dateTime: start }
        },
        'end': { dateTime: end },
        'conferenceData': {
            'createRequest': {
                'requestId': 'some-random-string', // Debe ser único para cada solicitud
            }
        }
    };

    const response = calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
    });
    onsole.log(response)
}