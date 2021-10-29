Yahoo Fantasy Basketball Stat Videos
------------------------------------

Example Usage
=============

Start service:
```
go run /home/henleyk/YahooFantasyStatVideos/api/main.go
```

Test Endpoint:

```
$ curl "http://localhost:10000/playervideos?playerID=1629001&teamID=1610612763&gameID=0022100040&statType=STL" | json_pp -json_opt pretty,canonical
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1363  100  1363    0     0  54520      0 --:--:-- --:--:-- --:--:-- 56791
[
   {
      "description" : "James Bad Pass Turnover (P1.T2)#@#Melton STEAL (1 STL)",
      "large_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/57/cbc7f4b5-f246-ba1d-2daf-c083c8892dcb_1280x720.mp4",
      "medium_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/57/cbc7f4b5-f246-ba1d-2daf-c083c8892dcb_960x540.mp4",
      "small_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/57/cbc7f4b5-f246-ba1d-2daf-c083c8892dcb_320x180.mp4"
   },
   {
      "description" : "James Bad Pass Turnover (P3.T9)#@#Melton STEAL (2 STL)",
      "large_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/355/2945da1c-ba2d-2c0d-947f-ae1188ea68a2_1280x720.mp4",
      "medium_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/355/2945da1c-ba2d-2c0d-947f-ae1188ea68a2_960x540.mp4",
      "small_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/355/2945da1c-ba2d-2c0d-947f-ae1188ea68a2_320x180.mp4"
   },
   {
      "description" : "Westbrook Bad Pass Turnover (P4.T10)#@#Melton STEAL (3 STL)",
      "large_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/366/0814bba2-064d-ec3b-50b5-29b9ecda0ac0_1280x720.mp4",
      "medium_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/366/0814bba2-064d-ec3b-50b5-29b9ecda0ac0_960x540.mp4",
      "small_url" : "https://videos.nba.com/nba/pbp/media/2021/10/24/0022100040/366/0814bba2-064d-ec3b-50b5-29b9ecda0ac0_320x180.mp4"
   }
]
```