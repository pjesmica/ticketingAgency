const Message = ({ variant = 'info', children }) => {
    const variantClass = {
        danger: 'tx-message-danger',
        success: 'tx-message-success',
        info: 'tx-message-info',
    }[variant] || 'tx-message-info';

    return (
        <div className={`tx-message ${variantClass}`}>
            {children}
        </div>
    );
};

export default Message;