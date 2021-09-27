import {useCallback} from 'react'
import {ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine} from 'recharts'
import {useState} from 'react'
import numeral from 'numeral'
import {useEffect} from 'react'
import {getMyPart} from '../../constants/general'

function Timeline(props) {
  const [timeline, setTimeline] = useState([])
  const participants = props.participants
  const match = props.match
  // const summoner = props.summoner
  const theme = props.store.state.theme

  const [timeline_index, setTimelineIndex] = useState(null)
  const [mypart, setMypart] = useState({})
  const [is_show_reference, setIsShowReference] = useState(false)

  let big_events = getBigEvents(timeline_index)

  function getEvents(index) {
    let events = []
    if (index !== null) {
      events = timeline[index].events
    }
    return events
  }

  function getBigEvents(index) {
    let events = getEvents(index)
    let include_events = new Set(['CHAMPION_KILL', 'BUILDING_KILL', 'ELITE_MONSTER_KILL'])
    let big_events = []
    for (let event of events) {
      if (include_events.has(event._type)) {
        if (event.killer_id !== 0) {
          big_events.push(event)
        }
      }
    }
    return big_events
  }

  function getMyTeamDataKey(style) {
    let myteam = mypart.team_id
    if (style === 'perc') {
      return `team${myteam}_perc_adv`
    }
    return `team${myteam}_adv`
  }

  function getOffset() {
    const dataMax = Math.max(...timeline.map((i) => i[getMyTeamDataKey()]))
    const dataMin = Math.min(...timeline.map((i) => i[getMyTeamDataKey()]))
    if (dataMax <= 0) {
      return 0
    } else if (dataMin >= 0) {
      return 1
    } else {
      return dataMax / (dataMax - dataMin)
    }
  }

  function getReferenceEvents() {
    let reference_lines = []
    let events
    let frame
    for (let i = 0; i < timeline.length; i++) {
      frame = timeline[i]
      events = getBigEvents(i)
      for (let event of events) {
        if (event._type === 'ELITE_MONSTER_KILL') {
          event.y_val = frame[getMyTeamDataKey()]
          event.frame_timestamp = frame.timestamp
          reference_lines.push(event)
        }
      }
    }
    return reference_lines
  }

  function getEventTeam(event) {
    let team_id = null
    let part
    if (event._type === 'CHAMPION_KILL') {
      part = getPart(event.victim_id)
      if (part !== null && part.team_id === 100) {
        team_id = 200
      } else {
        team_id = 100
      }
    } else if (event._type === 'BUILDING_KILL') {
      if (event.team_id === 100) {
        team_id = 200
      } else {
        team_id = 100
      }
    } else if (event._type === 'ELITE_MONSTER_KILL') {
      part = getPart(event.killer_id)
      team_id = part.team_id
    }
    return team_id
  }

  function getPart(participant_id) {
    for (var part of participants) {
      if (part._id === participant_id) {
        return part
      }
    }
    return null
  }

  const sortTimelineEvents = useCallback((timeline) => {
    for (let i = 0; i < timeline.length; i++) {
      timeline[i].events = timeline[i].events.sort((a, b) => {
        return a.timestamp - b.timestamp
      })
    }
    return timeline
  }, [])

  function combineTimelineCS(timeline) {
    for (let i = 0; i < timeline.length; i++) {
      for (let j = 0; j < timeline[i].participantframes.length; j++) {
        timeline[i].participantframes[j].cs =
          timeline[i].participantframes[j].jungle_minions_killed +
          timeline[i].participantframes[j].minions_killed
      }
    }
    return timeline
  }

  const addTeamGoldToTimeline = useCallback((timeline, participants) => {
    let team100 = []
    let team200 = []
    for (let part of participants) {
      if (part.team_id === 100) {
        team100.push(part._id)
      } else {
        team200.push(part._id)
      }
    }
    let team100_total
    let team200_total
    for (let frame of timeline) {
      team100_total = 0
      team200_total = 0
      for (let pframe of frame.participantframes) {
        if (pframe.total_gold !== undefined) {
          if (team100.indexOf(pframe.participant_id) >= 0) {
            team100_total += pframe.total_gold
          } else {
            team200_total += pframe.total_gold
          }
        }
      }
      frame.team100_gold = team100_total
      frame.team200_gold = team200_total

      frame.team100_adv = frame.team100_gold - frame.team200_gold
      frame.team200_adv = frame.team200_gold - frame.team100_gold

      if (frame.team100_adv >= 0) {
        frame.team100_perc_adv = (frame.team100_adv / team200_total) * 100
        frame.team200_perc_adv = -frame.team100_perc_adv
      } else {
        frame.team200_perc_adv = (frame.team200_adv / team100_total) * 100
        frame.team100_perc_adv = -frame.team200_perc_adv
      }
    }
    return timeline
  }, [])

  useEffect(() => {
    let new_timeline = addTeamGoldToTimeline(props.timeline, participants)
    new_timeline = sortTimelineEvents(new_timeline)
    new_timeline = combineTimelineCS(new_timeline)
    setTimeline(new_timeline)
  }, [props.timeline, addTeamGoldToTimeline, participants, sortTimelineEvents])

  useEffect(() => {
    if (props.summoner !== undefined) {
      setMypart(getMyPart(participants, props.summoner.account_id))
    }
  }, [props.summoner, participants])

  useEffect(() => {
    if (props.timeline_index) {
      setTimelineIndex(props.timeline_index)
      setIsShowReference(true)
    }
  }, [props.timeline_index])

  let div_width = 600
  return (
    <div>
      <div className="align-center">
        <ComposedChart
          width={div_width}
          height={300}
          data={props.timeline}
          margin={{
            top: 10,
            right: 15,
            left: -5,
            bottom: 0,
          }}
          onMouseMove={(props) => {
            if (props.activeTooltipIndex !== undefined) {
              let new_timeline_index = props.activeTooltipIndex
              setTimelineIndex(new_timeline_index)
              if (is_show_reference) {
                setIsShowReference(false)
              }
            }
          }}
          onMouseOut={() => setTimelineIndex(null)}
        >
          <CartesianGrid vertical={false} stroke="#777" strokeDasharray="4 4" />
          <XAxis
            hide={true}
            tickFormatter={(tickItem) => {
              let m = Math.round(tickItem / 1000 / 60)
              return `${m}m`
            }}
            dataKey="timestamp"
          />

          <YAxis
            // domain={this.getDomain()}
            yAxisId="left"
            orientation="left"
            tickFormatter={(tick) => {
              return numeral(tick).format('0.0a')
            }}
          />

          <Tooltip
            offset={70}
            formatter={(value, name) => {
              if (name.indexOf('perc') >= 0) {
                value = numeral(value).format('0')
                return [`${value}%`, '% Gold Adv.']
              } else {
                value = numeral(value).format('0,0')
                return [`${value}g`, 'Gold Adv.']
              }
            }}
            labelFormatter={(label) => {
              let m = Math.round(label / 1000 / 60)
              return `${m}m`
            }}
          />
          <defs>
            <linearGradient id={`${match._id}-gradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={getOffset()} stopColor="#3674ad" stopOpacity={1} />
              <stop offset={getOffset()} stopColor="#cd565a" stopOpacity={1} />
            </linearGradient>
          </defs>

          <Area
            yAxisId="left"
            type="monotone"
            dataKey={getMyTeamDataKey()}
            stroke="#000"
            fill={`url(#${match._id}-gradient)`}
          />

          {getReferenceEvents().map((event) => {
            let color = '#3674ad'
            if (getEventTeam(event) !== mypart.team_id) {
              color = '#cd565a'
            }
            let stroke_width = 1
            if (event.monster_type === 'BARON_NASHOR') {
              stroke_width = 3
            } else if (event.monster_sub_type === 'ELDER_DRAGON') {
              stroke_width = 3
            }
            return (
              <ReferenceLine
                yAxisId="left"
                key={`${match._id}-${event.timestamp}`}
                x={event.frame_timestamp}
                stroke={color}
                strokeWidth={stroke_width}
              />
            )
          })}

          {is_show_reference && props.timeline_index && (
            <ReferenceLine
              yAxisId="left"
              x={timeline[props.timeline_index].timestamp}
              stroke="white"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </div>

      {/* EVENTS */}
      <div
        style={{
          margin: '10px 10px 10px 30px',
          borderStyle: 'solid',
          borderWidth: 1,
          borderRadius: 5,
          borderColor: 'gray',
          height: 240,
          width: div_width,
          overflowY: 'hidden',
        }}
      >
        {big_events.length === 0 && (
          <div style={{textAlign: 'center', paddingTop: 20}}>Hover over graph to see events.</div>
        )}
        {big_events.map((event, key) => {
          let some_style = {
            width: '50%',
          }
          let is_right = false
          if (getEventTeam(event) === 100) {
          } else {
            is_right = true
          }

          let part1 = getPart(event.killer_id)
          let part2 = getPart(event.victim_id)

          let is_me = false
          if (
            (part1 !== null && part1._id === mypart._id) ||
            (part2 !== null && part2._id === mypart._id)
          ) {
            is_me = true
          }
          let is_me_style = {}
          if (is_me) {
            is_me_style = {
              background: '#323042',
              borderRadius: 5,
            }
          }
          return (
            <div style={{height: 20, ...is_me_style}} key={`${match._id}-event-${key}`}>
              {is_right && <div style={{width: '50%', display: 'inline-block'}}></div>}
              <small style={{...some_style, display: 'inline-block', verticalAlign: 'middle'}}>
                <div
                  style={{width: 35, verticalAlign: 'top', display: 'inline-block', marginLeft: 5}}
                  className={`${props.theme} muted`}
                >
                  {Math.floor(event.timestamp / 1000 / 60)}:
                  {numeral((event.timestamp / 1000) % 60).format('00')}
                </div>{' '}
                <span style={{verticalAlign: 'top'}}>
                  {event._type === 'CHAMPION_KILL' && (
                    <span>
                      <span>
                        {part1 !== null && (
                          <img style={{height: 15}} src={part1.champion.image?.file_30} alt="" />
                        )}
                        {part1 === null && <span>minions</span>}
                      </span>{' '}
                      <span>
                        <span style={{verticalAlign: 'text-bottom'}} className={`${theme} pill`}>
                          killed
                        </span>
                      </span>{' '}
                      <span>
                        <img style={{height: 15}} src={part2.champion.image?.file_30} alt="" />
                      </span>
                    </span>
                  )}

                  {event._type === 'BUILDING_KILL' && (
                    <span>
                      <span>
                        {part1 !== null && (
                          <img style={{height: 15}} src={part1.champion.image?.file_30} alt="" />
                        )}
                        {part1 === null && <span>minions</span>}
                      </span>{' '}
                      <span>
                        <span style={{verticalAlign: 'text-bottom'}} className={`${theme} pill`}>
                          destroyed
                        </span>
                      </span>{' '}
                      <span style={{verticalAlign: 'text-bottom'}}>
                        {event.building_type === 'TOWER_BUILDING' && <span>tower</span>}
                        {event.building_type === 'INHIBITOR_BUILDING' && <span>inhib</span>}
                        {['TOWER_BUILDING', 'INHIBITOR_BUILDING'].indexOf(event.building_type) ===
                          -1 && <span>structure</span>}
                      </span>
                    </span>
                  )}

                  {event._type === 'ELITE_MONSTER_KILL' && (
                    <span>
                      <span>
                        {part1 !== null && (
                          <img style={{height: 15}} src={part1.champion.image?.file_30} alt="" />
                        )}
                        {part1 === null && <span>minions</span>}
                      </span>{' '}
                      <span>
                        <span style={{verticalAlign: 'text-bottom'}} className={`${theme} pill`}>
                          killed
                        </span>
                      </span>{' '}
                      <span style={{verticalAlign: 'text-bottom'}}>
                        {function (event) {
                          if (event.monster_type === 'DRAGON') {
                            if (event.monster_sub_type === 'EARTH_DRAGON') {
                              return <span>earth</span>
                            } else if (event.monster_sub_type === 'WATER_DRAGON') {
                              return <span>water</span>
                            } else if (event.monster_sub_type === 'FIRE_DRAGON') {
                              return <span>fire</span>
                            } else if (event.monster_sub_type === 'AIR_DRAGON') {
                              return <span>cloud</span>
                            } else if (event.monster_sub_type === 'ELDER_DRAGON') {
                              return <span>elder</span>
                            } else {
                              return <span>{event.monster_sub_type}</span>
                            }
                          } else if (event.monster_type === 'BARON_NASHOR') {
                            return <span>purple snek</span>
                          } else if (event.monster_type === 'RIFTHERALD') {
                            return <span>big scuttle</span>
                          } else {
                            return (
                              <span>
                                {event.monster_type} {event.monster_sub_type}
                              </span>
                            )
                          }
                        }.bind(this, event)()}
                      </span>
                    </span>
                  )}
                </span>
              </small>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export {Timeline}
