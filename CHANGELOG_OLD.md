# Older changes
## 2.2.0 (2024-04-13)

* (mcm1957) Adapter requires node.js 18 and js-controller >= 5 now
* (mcm1957) Dependencies have been updated

## 2.1.2 (2023-10-26)

- (agross) Functionality of state.on turning false immediately after turning off the TV with turnOff has been restored. [#165]
- (mcm1957) Dependencies have been updated

## 2.1.1 (2023-10-06)

- (basti4557) Websocket configuration has been fixed [#161].

## 2.1.0 (2023-10-05)

- (basti4557) A bug that destryed the actual app state on changing from tv to app mode has been fixed.
- (basti4557) Websocket SSL states can now be sent / received again due to the websocket ssl changes.
- (basti4557) Plain websocket has been replced by SSL Websocket.

## 2.0.0 (2023-10-03)

- (mcm1957) Adapter has been moved to iobroker-community-adapters area
- (mcm1957) POSSIBLE BREAKING: Adapter has been built from current github content. As latest npm packages have been created external, theres a chance that some changes got lost.
- (jpawlowski) Travis and AppVeyor have been replced by GitHub Actions, based on ioBroker/create-adapter
- (jpawlowski) Adpter requires NodeJS 16 minimum now
- (jpawlowski) Dependencies have been updated
- (jpawlowski) Configuration item healthIntervall has been rename/correct to healthInterval

## 1.1.12 (2023-07-04)

-   (foxriver76) prepare for controller v5

## 1.1.10 (2020-08-24)

-   (SebastianSchultz) support WebOS 5 for volume change

## 1.1.9 (2020-07-14)

-   (SebastianSchultz) re-upload for fixing NPM update issue

## 1.1.8 (2020-07-08)

-   (SebastianSchultz) bugfix for "IndexOf" error

## 1.1.6 (2020-03-07)

-   (dirkhe) make healthintervall configurable

## 1.1.5 (2020-02-25)

-   (dirkhe) stable connection and subsciptions
-   (dirkhe) add Polling for TV, which not support Power Off event
-   (dirkhe) change some states role switch to button

## 1.1.4 (2020-02-07)

-   (dirkhe) changed from pull to subscribing
-   (dirkhe) add livetv to launch list

## 1.1.3 (2019-12-16)

-   (merdok) fixed connect() [Pull requests #62](https://github.com/SebastianSchultz/ioBroker.lgtv/pull/62)
-   (instalator) fixed [issues #64](https://github.com/SebastianSchultz/ioBroker.lgtv/issues/64)
-   (instalator) change error log to debug [issues #59](https://github.com/SebastianSchultz/ioBroker.lgtv/issues/59)

## 1.1.1 (2019-10-26)

-   (instalator) Safe keyfile to /opt/iobroker [issues #52](https://github.com/SebastianSchultz/ioBroker.lgtv/issues/52)
-   (instalator) fix error reconect
-   (instalator) fix raw object
-   (instalator) add mac address to admin settings

## 1.1.0 (2019-10-10)

-   (instalator) adding object remote.KEY
-   (instalator) fix connect to TV
-   (instalator) add subscribe volume and mute state
-   (instalator) translate admin to RUS
-   (instalator) add Turn On, using WOL
-   (instalator) adding new different objects
-   (SebastianSchultz) changed roles "button" to "switch" for compatibility for iot- & cloud-adapter

## 1.0.8 (2019-03-15)

-   (SebastianSchultz) general NPM update

## 1.0.7 (2019-01-28)

-   (SebastianSchultz) grouping of all states/objects under a device

## 1.0.6 (2019-01-21)

-   (SebastianSchultz) added compact mode

## 1.0.5 (2018-04-15)

-   (SebastianSchultz) added Travis-CI and AppVeyor tests

## 1.0.4 (2018-04-07)

-   (SebastianSchultz) added support for increasing (channelUp) or decreasing (channelDown) the current TV channelDown
-   (SebastianSchultz) added the state "volume" which holds the current volume level

## 1.0.3 (2018-01-11)

-   (SebastianSchultz) added support for launching Amazon Prime app via "amazon" (used on some TV's instead of "prime")
-   (SebastianSchultz) fixed issue that state "on" was not set when in an app on TV

## 1.0.2 (2017-05-23)

-   (SebastianSchultz) added support for launching Amazon Prime app

## 1.0.0 (2016-09-26)

-   (SebastianSchultz) added channel polling
-   (SebastianSchultz) added switching input

## 0.0.4 (2016-09-12)

-   (SebastianSchultz) solved saving IP address within adapter configuration

## 0.0.3 (2016-09-05)

-   (SebastianSchultz) added volumeUp true|false
-   (SebastianSchultz) added volumeDown true|false
-   (SebastianSchultz) added 3Dmode true|false
-   (SebastianSchultz) added launch livetv|smartshare|tvuserguide|netflix|youtube|<URL>
-   (SebastianSchultz) added channel <channelNumber>
-   (SebastianSchultz) some code cleaned

## 0.0.2 (2016-09-02)

-   (SebastianSchultz) removed reconnect function, not used
-   (SebastianSchultz) improved error handling and logging

## 0.0.1 (2016-08-31)

-   (SebastianSchultz) initial commit

---