import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import numeral from 'numeral'

import api from '../../api/api'


class PlayerChampionSummary extends Component {
    constructor(props) {
        super(props)

        this.state = {
            time_division: 'days',
            time_value: 30,
            version: {},
            start: 0,
            end: 5,

            stats: [],

            queues: [],
        }

        this.getParams = this.getParams.bind(this)
        this.getChampionStats = this.getChampionStats.bind(this)
        this.getChampionData = this.getChampionData.bind(this)
        this.isTimeFrameSelected = this.isTimeFrameSelected.bind(this)
        this.getCurrentSeason = this.getCurrentSeason.bind(this)
        this.updateTimeFrame = this.updateTimeFrame.bind(this)
        this.renderChampionData = this.renderChampionData.bind(this)
    }
    componentDidMount() {
        this.getCurrentSeason()
        this.getChampionStats()
    }
    componentDidUpdate(prevProps) {
        if (this.props.summoner.id !== prevProps.summoner.id) {
            this.getChampionStats()
        }
    }
    getCurrentSeason() {
        api.data.getCurrentSeason()
            .then(response => {
                this.setState({version: response.data.data})
            })
    }
    getChampionData() {
        let data = {
            champions: this.state.stats.map(stat => stat.key),
        }
    }
    getParams() {
        let data = {
            summoner_id: this.props.summoner.id,
            queue_in: this.state.queues,
            start: this.state.start,
            end: this.state.end,
            order_by: '-count',
        }
        if (this.state.time_division === 'days') {
            let now = moment()
            let start = now.subtract(this.state.time_value, 'days')
            data.start_datetime = start.toISOString()
        }
        else if (this.state.time_division === 'season') {
            data.major_version = this.state.time_value
        }

        return data
    }
    getChampionStats() {
        let data = this.getParams()

        if (data.summoner_id !== undefined) {
            api.player.getChampionsOverview(data)
                .then(response => {
                    this.setState({stats: response.data.data})
                })
                .catch(error => {

                })
                .then(() => {

                })
        }
    }
    isTimeFrameSelected(time_division, time_value) {
        if (this.state.time_division === time_division && this.state.time_value === time_value) {
            return true
        }
        return false
    }
    updateTimeFrame(time_division, time_value) {
        this.setState({time_division, time_value}, this.getChampionStats)
    }
    renderChampionData(data) {
        let average_kills = data.kills_sum / data.count
        let average_deaths = data.deaths_sum / data.count
        let average_assists = data.assists_sum / data.count
        let win_percentage = (data.wins / (data.wins + data.losses)) * 100
        return(
            <span>
                <div>
                    {data.champion}
                </div>
                <div>
                    <div>
                        {numeral(win_percentage).format('0.0')} %
                    </div>
                    <div>
                        {data.wins} - {data.losses}
                    </div>
                </div>
                <div>
                    <div>
                        KDA {numeral(data.kda).format('0.00')}
                    </div>
                    <div style={{fontSize: 'small'}}>
                        {numeral(average_kills).format('0.00')}/{numeral(average_deaths).format('0.00')}/{numeral(average_assists).format('0.00')}
                    </div>
                </div>
            </span>
        )
    }
    render() {
        // const store = this.props.store
        // const parent = this.props.parent
        // const summoner = this.props.summoner
        // const theme = store.state.theme
        const major = this.state.version.major

        const unselected_style = {
            display: 'inline-block',
            fontSize: 'small',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: 'grey',
            padding: 3,
            borderRadius: 3,
            cursor: 'pointer',
            width: 100,
            textAlign: 'center',
            margin: '0 4px',
        }
        let selected_style = {
            ...unselected_style
        }
        selected_style.fontWeight = 'bold'
        selected_style.borderWidth = 2
        selected_style.borderColor = '#9aa8ce'
        selected_style.color = '#9aa8ce'

        let queue_selected_style = {
            ...selected_style
        }
        queue_selected_style.borderColor = 'white'
        queue_selected_style.color = 'white'
        return (
            <div>
                <div
                    style={{marginBottom: 5}}
                    className="row">
                    <div className='col s12'>
                        <div
                            onClick={() => this.updateTimeFrame('days', 30)}
                            style={this.isTimeFrameSelected('days', 30) ? selected_style : unselected_style}>
                            30 days
                        </div>
                        <div
                            onClick={() => this.updateTimeFrame('days', 60)}
                            style={this.isTimeFrameSelected('days', 60) ? selected_style : unselected_style}>
                            60 days
                        </div>
                    </div>
                </div>
                <div
                    style={{marginBottom: 5}}
                    className="row">
                    <div className="col s12">
                        {major !== undefined && [major, major - 1, major - 2].map((ver, key) => {
                            return(
                                <div
                                    key={`${ver}-${key}`}
                                    onClick={() => this.updateTimeFrame('season', ver)}
                                    style={this.isTimeFrameSelected('season', ver) ? selected_style : unselected_style}>
                                    Season {ver}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div
                    style={{marginBottom:0}}
                    className="row">
                    <div className="col s12">
                        {this.state.stats.map((data, key) => {
                            return (
                                <div
                                    style={{
                                        display: 'inline-block',
                                        width: 120,
                                    }}
                                    key={`${data.champion}-${key}`}>
                                    {this.renderChampionData(data)}    
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }
}
PlayerChampionSummary.propTypes = {
    store: PropTypes.object.isRequired,
    parent: PropTypes.object.isRequired,
    summoner: PropTypes.object.isRequired,
}


export default PlayerChampionSummary