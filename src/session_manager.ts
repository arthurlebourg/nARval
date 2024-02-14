export class SessionManager
{
    private _username: string;
    private WebSocket: WebSocket;

    private static _instance: SessionManager;

    private constructor(username: string)
    {
        this._username = username;
        this.WebSocket = new WebSocket("ws://localhost:8080");
        this.WebSocket.onopen = () =>
        {
            this.WebSocket.send(`{"type": "username", "username": "${this._username}"}`);
        }
    }

    public static initialize(username: string)
    {
        this._instance = new SessionManager(username);
    }

    public static get instance()
    {
        if (!SessionManager._instance)
        {
            throw new Error("SessionManager not initialized");
        }

        return SessionManager._instance;
    }
}